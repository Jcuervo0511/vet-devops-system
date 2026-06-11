import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  CHAOS_DEFAULT_DELAY_MS,
  isEnabled,
  positiveInteger,
} from '../chaos.constants';

@Injectable()
export class LatencyChaosInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const delayMs = positiveInteger(
      this.configService.get<string>('CHAOS_DELAY_MS'),
      CHAOS_DEFAULT_DELAY_MS,
    );
    const protectionEnabled = isEnabled(
      this.configService.get<string>('CHAOS_PROTECTION_ENABLED'),
    );

    if (!protectionEnabled) {
      // CAOS: bloquea el event loop y retrasa todas las solicitudes.
      const blockedUntil = Date.now() + delayMs;
      while (Date.now() < blockedUntil) {
        // The busy loop represents CPU-bound synchronous work.
      }

      return next.handle();
    }

    return next.handle().pipe(delay(delayMs));
  }
}
