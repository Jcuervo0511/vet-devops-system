import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChaosGuard } from './chaos.guard';
import { ChaosService } from './chaos.service';

@ApiTags('chaos')
@ApiHeader({ name: 'x-chaos-key', required: true })
@UseGuards(ChaosGuard)
@Controller('chaos')
export class ChaosController {
  constructor(private readonly chaosService: ChaosService) {}

  @ApiOperation({ summary: 'Show global chaos experiment metrics' })
  @Get('status')
  status() {
    return this.chaosService.getStatus();
  }

  @ApiOperation({
    summary: 'Clear memory retained by global chaos experiments',
  })
  @Delete('reset')
  reset() {
    return this.chaosService.reset();
  }
}
