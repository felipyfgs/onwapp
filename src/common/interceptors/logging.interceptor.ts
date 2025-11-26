import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Logging interceptor that logs all incoming requests and outgoing responses.
 *
 * Features:
 * - Logs request method, URL, and session ID
 * - Logs response time for performance monitoring
 * - Different log levels based on response time
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const sessionId = request.params?.sessionId;

    const now = Date.now();
    const requestLog = sessionId
      ? `${method} ${url} [session: ${sessionId}]`
      : `${method} ${url}`;

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;
          const logMessage = `${requestLog} - ${responseTime}ms`;

          // Log with appropriate level based on response time
          if (responseTime > 5000) {
            this.logger.warn(`SLOW ${logMessage}`);
          } else {
            this.logger.log(logMessage);
          }
        },
        error: () => {
          const responseTime = Date.now() - now;
          this.logger.log(`${requestLog} - ${responseTime}ms [ERROR]`);
        },
      }),
    );
  }
}
