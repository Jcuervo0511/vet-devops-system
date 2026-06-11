import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, retry, throwError, timer } from 'rxjs';
import { CHAOS_RETRY_DELAY_MS, isEnabled } from '../chaos.constants';

@Injectable()
export class Retry503Interceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if (
      !isEnabled(
        this.configService.get<string>('CHAOS_PROTECTION_ENABLED'),
      )
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      retry({
        count: 1,
        delay: (error) => {
          if (!(error instanceof ServiceUnavailableException)) {
            return throwError(() => error);
          }

          return timer(CHAOS_RETRY_DELAY_MS);
        },
      }),
    );
  }
}
