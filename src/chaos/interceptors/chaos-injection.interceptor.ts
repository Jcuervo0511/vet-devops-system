import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import {
  defer,
  delay,
  Observable,
  retry,
  throwError,
  timer,
} from 'rxjs';
import { ChaosAccessService } from '../chaos-access.service';
import {
  CHAOS_DEFAULT_DELAY_MS,
  CHAOS_RETRY_DELAY_MS,
  ChaosScenario,
  isChaosScenario,
  isEnabled,
  positiveInteger,
} from '../chaos.constants';
import { ChaosService } from '../chaos.service';

@Injectable()
export class ChaosInjectionInterceptor implements NestInterceptor {
  constructor(
    private readonly configService: ConfigService,
    private readonly chaosAccessService: ChaosAccessService,
    private readonly chaosService: ChaosService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const scenarioHeader = request.header('x-chaos-scenario');

    if (!scenarioHeader) {
      return next.handle();
    }

    if (!isChaosScenario(scenarioHeader)) {
      throw new BadRequestException(
        'x-chaos-scenario must be latency, transient-error or memory',
      );
    }

    this.chaosAccessService.assertAllowed(request);
    response.setHeader('x-chaos-scenario', scenarioHeader);

    return this.applyScenario(scenarioHeader, response, next);
  }

  private applyScenario(
    scenario: ChaosScenario,
    response: Response,
    next: CallHandler,
  ): Observable<unknown> {
    switch (scenario) {
      case 'latency':
        return this.applyLatency(next);
      case 'transient-error':
        return this.applyTransientError(response, next);
      case 'memory':
        return this.applyMemory(response, next);
    }
  }

  private applyLatency(next: CallHandler): Observable<unknown> {
    const delayMs = positiveInteger(
      this.configService.get<string>('CHAOS_DELAY_MS'),
      CHAOS_DEFAULT_DELAY_MS,
    );

    if (!this.isProtectionEnabled()) {
      // CAOS: bloquea el event loop del endpoint seleccionado.
      const blockedUntil = Date.now() + delayMs;
      while (Date.now() < blockedUntil) {
        // The busy loop represents CPU-bound synchronous work.
      }

      return next.handle();
    }

    return next.handle().pipe(delay(delayMs));
  }

  private applyTransientError(
    response: Response,
    next: CallHandler,
  ): Observable<unknown> {
    let attempts = 0;
    const source = defer(() => {
      attempts += 1;
      response.setHeader('x-chaos-attempts', attempts.toString());

      // CAOS: genera un error 503 en el primer intento del endpoint.
      if (attempts === 1) {
        return throwError(
          () => new ServiceUnavailableException('Transient chaos error'),
        );
      }

      return next.handle();
    });

    if (!this.isProtectionEnabled()) {
      return source;
    }

    return source.pipe(
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

  private applyMemory(
    response: Response,
    next: CallHandler,
  ): Observable<unknown> {
    // CAOS: asigna memoria durante la ejecución del endpoint seleccionado.
    const status = this.chaosService.allocateMemory();
    response.setHeader('x-chaos-retained-bytes', status.retainedBytes.toString());
    return next.handle();
  }

  private isProtectionEnabled(): boolean {
    return isEnabled(
      this.configService.get<string>('CHAOS_PROTECTION_ENABLED'),
    );
  }
}
