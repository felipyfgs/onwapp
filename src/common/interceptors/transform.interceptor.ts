import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Standard API response wrapper structure
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

/**
 * Transform interceptor that wraps all successful responses
 * in a consistent response structure.
 *
 * Response format:
 * {
 *   success: true,
 *   data: <actual response data>,
 *   timestamp: <ISO timestamp>
 * }
 *
 * Note: This interceptor can be optionally enabled per controller
 * using the @UseInterceptors decorator if uniform response format is desired.
 * Currently NOT applied globally to maintain backward compatibility.
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
