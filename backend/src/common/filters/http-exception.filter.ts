import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '@prisma/client';

function isPrismaConnectivityError(exception: unknown): boolean {
  return (
    exception instanceof Prisma.PrismaClientInitializationError ||
    exception instanceof Prisma.PrismaClientRustPanicError ||
    (exception instanceof Prisma.PrismaClientKnownRequestError &&
      ['P1001', 'P1002', 'P1008', 'P1017'].includes(exception.code))
  );
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected server error occurred';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        message = resObj.message || exception.message;
        errorCode = resObj.error || this.getErrorCodeFromStatus(status);
        details = resObj.details || (Array.isArray(resObj.message) ? resObj.message : null);
      }
    } else if (isPrismaConnectivityError(exception)) {
      // Transient DB unreachability (e.g. a serverless Postgres instance waking from
      // idle) is not a bug — never leak the raw Prisma message (it includes the DB
      // host) and report it as a retryable 503, not a 500.
      status = HttpStatus.SERVICE_UNAVAILABLE;
      errorCode = 'SERVICE_UNAVAILABLE';
      message = 'The database is temporarily unavailable. Please retry in a few seconds.';
      this.logger.warn(`DB connectivity error at ${request.method} ${request.url}: ${(exception as Error).message}`);
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Exception at ${request.method} ${request.url}: ${exception.stack}`);
    }

    // Do not leak stack traces or raw db errors in production
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = 'An internal institutional server error occurred';
      details = null;
    }

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message,
        details,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
