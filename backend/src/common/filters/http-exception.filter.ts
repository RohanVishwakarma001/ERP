import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '@prisma/client';
import { pathOnly } from '../utils/redact';

/** Shape of every error response. Clients rely on `error.code` and `error.message`. */
export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown;
    path: string;
    timestamp: string;
  };
}

interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

const STATUS_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.NOT_IMPLEMENTED]: 'NOT_IMPLEMENTED',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

/** Prisma error codes meaning the database itself is unreachable, not that the query was wrong. */
const PRISMA_CONNECTIVITY_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017']);

function fromHttpException(exception: HttpException): NormalizedError {
  const status = exception.getStatus();
  const res = exception.getResponse();
  const code = STATUS_CODES[status] ?? 'ERROR';

  if (typeof res === 'string') return { status, code, message: res };

  const body = res as Record<string, unknown>;
  // class-validator failures arrive as `message: string[]`.
  if (Array.isArray(body.message)) {
    return { status, code: 'VALIDATION_FAILED', message: String(body.message[0]), details: body.message };
  }
  return { status, code, message: String(body.message ?? exception.message), details: body.details };
}

/**
 * body-parser / multer reject oversized or malformed requests with plain errors
 * carrying an HTTP `status` and `expose: true`. They are client errors (413/400),
 * not server faults — report them as such rather than as a 500.
 */
function fromBodyParserError(exception: unknown): NormalizedError | null {
  const err = exception as { status?: unknown; expose?: unknown; type?: unknown };
  if (typeof err?.status !== 'number' || err.status < 400 || err.status >= 500 || err.expose !== true) return null;
  const status = err.status;
  const message =
    err.type === 'entity.too.large'
      ? 'Request body is too large.'
      : err.type === 'entity.parse.failed'
        ? 'Request body is not valid JSON.'
        : 'Malformed request.';
  return { status, code: STATUS_CODES[status] ?? 'BAD_REQUEST', message };
}

function fromPrismaError(exception: unknown): NormalizedError | null {
  if (
    exception instanceof Prisma.PrismaClientInitializationError ||
    exception instanceof Prisma.PrismaClientRustPanicError ||
    (exception instanceof Prisma.PrismaClientKnownRequestError && PRISMA_CONNECTIVITY_CODES.has(exception.code))
  ) {
    // A serverless Postgres instance waking from idle is transient, not a bug — report
    // a retryable 503 and never leak the raw message (it contains the DB host).
    return {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      code: 'DATABASE_UNAVAILABLE',
      message: 'The database is temporarily unavailable. Please retry in a few seconds.',
    };
  }

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, code: 'NOT_FOUND', message: 'The requested record does not exist.' };
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONFLICT',
          message: 'A record with these details already exists.',
        };
      case 'P2003':
        return { status: HttpStatus.BAD_REQUEST, code: 'BAD_REFERENCE', message: 'A referenced record does not exist.' };
    }
  }
  return null;
}

/**
 * Converts every thrown error into the `{ success: false, error }` envelope.
 * Services should throw Nest HTTP exceptions for business-rule failures and let
 * Prisma errors propagate — this filter maps them to the right status.
 */
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  constructor(private readonly isProduction: boolean) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const where = `${request.method} ${pathOnly(request.url)}`;

    let error: NormalizedError;
    const clientError = fromBodyParserError(exception);
    if (exception instanceof HttpException) {
      error = fromHttpException(exception);
    } else if (clientError) {
      error = clientError;
    } else {
      const prismaError = fromPrismaError(exception);
      if (prismaError) {
        error = prismaError;
        this.logger.warn(`${where} → ${prismaError.code}: ${(exception as Error).message}`);
      } else {
        error = {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'INTERNAL_SERVER_ERROR',
          // Never leak internals in production.
          message: this.isProduction ? 'An internal server error occurred.' : (exception as Error)?.message ?? 'Unknown error',
        };
        this.logger.error(`Unhandled exception at ${where}`, (exception as Error)?.stack);
      }
    }

    const body: ApiErrorBody = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
        path: pathOnly(request.url),
        timestamp: new Date().toISOString(),
      },
    };
    response.status(error.status).json(body);
  }
}
