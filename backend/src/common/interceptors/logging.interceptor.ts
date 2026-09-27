import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = res;
          const duration = Date.now() - now;
          this.logger.log(
            `[${method}] ${originalUrl} ${statusCode} - ${duration}ms [${userAgent.slice(0, 40)}]`,
          );
        },
        error: (err) => {
          const duration = Date.now() - now;
          this.logger.error(
            `[${method}] ${originalUrl} FAILED - ${duration}ms: ${err.message}`,
          );
        },
      }),
    );
  }
}
