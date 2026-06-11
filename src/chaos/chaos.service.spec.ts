import { ConfigService } from '@nestjs/config';
import { ChaosService } from './chaos.service';

describe('ChaosService', () => {
  const values: Record<string, string> = {};
  const configService = {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;

  beforeEach(() => {
    values.CHAOS_MEMORY_MB = '1';
    values.CHAOS_PROTECTION_ENABLED = 'false';
    jest.clearAllMocks();
  });

  it('retains memory in vulnerable mode', () => {
    const service = new ChaosService(configService);

    const result = service.allocateMemory();

    expect(result.retainedBlocks).toBe(1);
    expect(result.retainedBytes).toBe(1024 * 1024);
  });

  it('does not retain memory in protected mode', () => {
    values.CHAOS_PROTECTION_ENABLED = 'true';
    const service = new ChaosService(configService);

    const result = service.allocateMemory();

    expect(result.retainedBlocks).toBe(0);
    expect(result.retainedBytes).toBe(0);
  });

  it('clears all retained blocks', () => {
    const service = new ChaosService(configService);
    service.allocateMemory();
    service.allocateMemory();

    const result = service.reset();

    expect(result.releasedBlocks).toBe(2);
    expect(result.retainedBytes).toBe(0);
  });
});
