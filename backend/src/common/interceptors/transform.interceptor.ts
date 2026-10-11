import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Files (PDF downloads) are streamed as-is, never wrapped in JSON.
        if (data instanceof StreamableFile) return data;

        // If data is already in standard format, return directly
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }

        let message = 'Success';
        let responseData = data;

        if (data && typeof data === 'object' && 'message' in data && 'data' in data) {
          message = data.message;
          responseData = data.data;
        }

        return {
          success: true,
          data: responseData,
          message,
        };
      }),
    );
  }
}
