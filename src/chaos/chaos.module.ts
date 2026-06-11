import { Module } from '@nestjs/common';
import { ChaosController } from './chaos.controller';
import { ChaosGuard } from './chaos.guard';
import { ChaosService } from './chaos.service';
import { LatencyChaosInterceptor } from './interceptors/latency-chaos.interceptor';
import { Retry503Interceptor } from './interceptors/retry-503.interceptor';
import { TransientErrorInterceptor } from './interceptors/transient-error.interceptor';

@Module({
  controllers: [ChaosController],
  providers: [
    ChaosService,
    ChaosGuard,
    LatencyChaosInterceptor,
    Retry503Interceptor,
    TransientErrorInterceptor,
  ],
})
export class ChaosModule {}
