import {
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChaosGuard } from './chaos.guard';
import { ChaosService } from './chaos.service';
import { LatencyChaosInterceptor } from './interceptors/latency-chaos.interceptor';
import { Retry503Interceptor } from './interceptors/retry-503.interceptor';
import { TransientErrorInterceptor } from './interceptors/transient-error.interceptor';

@ApiTags('chaos')
@ApiHeader({ name: 'x-chaos-key', required: true })
@UseGuards(ChaosGuard)
@Controller('chaos')
export class ChaosController {
  constructor(private readonly chaosService: ChaosService) {}

  @ApiOperation({ summary: 'Simulate blocking or isolated latency' })
  @UseInterceptors(LatencyChaosInterceptor)
  @Get('latency')
  latency() {
    return {
      status: 'ok',
      scenario: 'latency',
    };
  }

  @ApiOperation({ summary: 'Simulate a transient HTTP 503 error' })
  @UseInterceptors(Retry503Interceptor, TransientErrorInterceptor)
  @Get('transient-error')
  transientError() {
    return {
      status: 'ok',
      scenario: 'transient-error',
      recovered: true,
    };
  }

  @ApiOperation({ summary: 'Allocate memory for the leak experiment' })
  @Post('memory')
  memory() {
    return this.chaosService.allocateMemory();
  }

  @ApiOperation({ summary: 'Show current chaos experiment metrics' })
  @Get('status')
  status() {
    return this.chaosService.getStatus();
  }

  @ApiOperation({ summary: 'Clear retained experiment memory' })
  @Delete('reset')
  reset() {
    return this.chaosService.reset();
  }
}
