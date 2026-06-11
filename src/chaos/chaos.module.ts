import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ChaosAccessService } from './chaos-access.service';
import { ChaosController } from './chaos.controller';
import { ChaosGuard } from './chaos.guard';
import { ChaosService } from './chaos.service';
import { ChaosInjectionInterceptor } from './interceptors/chaos-injection.interceptor';

@Global()
@Module({
  controllers: [ChaosController],
  providers: [
    ChaosService,
    ChaosAccessService,
    ChaosGuard,
    ChaosInjectionInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: ChaosInjectionInterceptor,
    },
  ],
  exports: [ChaosService, ChaosAccessService, ChaosInjectionInterceptor],
})
export class ChaosModule {}
