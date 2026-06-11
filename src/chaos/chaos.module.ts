import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ChaosAccessService } from './chaos-access.service';
import { ChaosController } from './chaos.controller';
import { ChaosGuard } from './chaos.guard';
import { ChaosService } from './chaos.service';
import { ChaosInjectionInterceptor } from './interceptors/chaos-injection.interceptor';
import { LatencyChaosInterceptor } from './interceptors/latency-chaos.interceptor';
import { Retry503Interceptor } from './interceptors/retry-503.interceptor';
import { TransientErrorInterceptor } from './interceptors/transient-error.interceptor';

@Global()
@Module({
  controllers: [ChaosController],
  providers: [
    ChaosService,
    ChaosAccessService,
    ChaosGuard,
    ChaosInjectionInterceptor,
    LatencyChaosInterceptor,
    Retry503Interceptor,
    TransientErrorInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: ChaosInjectionInterceptor,
    },
  ],
  exports: [
    ChaosService,
    ChaosAccessService,
    ChaosInjectionInterceptor,
    LatencyChaosInterceptor,
    Retry503Interceptor,
    TransientErrorInterceptor,
  ],
})
export class ChaosModule {}
