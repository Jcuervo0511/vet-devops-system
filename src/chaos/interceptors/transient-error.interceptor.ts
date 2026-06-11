import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request } from 'express';
import { defer, Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

type ChaosRequest = Request & {
  chaosTransientAttempts?: number;
};

@Injectable()
export class TransientErrorInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<ChaosRequest>();

    return defer(() => {
      request.chaosTransientAttempts =
        (request.chaosTransientAttempts ?? 0) + 1;

      // CAOS: simula un error transitorio 503 en el primer intento.
      if (request.chaosTransientAttempts === 1) {
        return throwError(
          () => new ServiceUnavailableException('Transient chaos error'),
        );
      }

      return next.handle();
    }).pipe(
      map((result) => ({
        ...(result as Record<string, unknown>),
        attempts: request.chaosTransientAttempts,
      })),
    );
  }
}
