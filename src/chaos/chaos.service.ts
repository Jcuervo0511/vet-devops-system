import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CHAOS_DEFAULT_MEMORY_MB, positiveInteger } from './chaos.constants';

@Injectable()
export class ChaosService {
  private readonly retainedBlocks: Buffer[] = [];

  constructor(private readonly configService: ConfigService) {}

  allocateMemory() {
    const memoryMb = positiveInteger(
      this.configService.get<string>('CHAOS_MEMORY_MB'),
      CHAOS_DEFAULT_MEMORY_MB,
    );
    const block = Buffer.alloc(memoryMb * 1024 * 1024, 1);

    if (!this.isProtectionEnabled()) {
      // CAOS: retiene memoria para simular una fuga controlada.
      this.retainedBlocks.push(block);
    }

    return {
      allocatedMb: memoryMb,
      ...this.getStatus(),
    };
  }

  getStatus() {
    const memory = process.memoryUsage();

    return {
      protectionEnabled: this.isProtectionEnabled(),
      retainedBlocks: this.retainedBlocks.length,
      retainedBytes: this.retainedBlocks.reduce(
        (total, block) => total + block.byteLength,
        0,
      ),
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        external: memory.external,
      },
    };
  }

  reset() {
    const releasedBlocks = this.retainedBlocks.length;
    this.retainedBlocks.length = 0;

    return {
      reset: true,
      releasedBlocks,
      ...this.getStatus(),
    };
  }

  private isProtectionEnabled(): boolean {
    return (
      this.configService
        .get<string>('CHAOS_PROTECTION_ENABLED')
        ?.toLowerCase() === 'true'
    );
  }
}
