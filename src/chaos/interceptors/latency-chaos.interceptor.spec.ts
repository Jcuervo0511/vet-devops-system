import { CallHandler, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, of } from 'rxjs';
import { LatencyChaosInterceptor } from './latency-chaos.interceptor';

describe('LatencyChaosInterceptor', () => {
  const values: Record<string, string> = {
    CHAOS_DELAY_MS: '20',
    CHAOS_PROTECTION_ENABLED: 'false',
  };
  const configService = {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
  const context = {} as ExecutionContext;
  const next: CallHandler = {
    handle: () => of({ status: 'ok' }),
  };

  beforeEach(() => {
    values.CHAOS_PROTECTION_ENABLED = 'false';
    jest.clearAllMocks();
  });

  it('blocks synchronously in vulnerable mode', async () => {
    const interceptor = new LatencyChaosInterceptor(configService);
    const startedAt = Date.now();

    const response = interceptor.intercept(context, next);
    const synchronousElapsed = Date.now() - startedAt;

    expect(synchronousElapsed).toBeGreaterThanOrEqual(15);
    await expect(lastValueFrom(response)).resolves.toEqual({ status: 'ok' });
  });

  it('returns immediately and delays asynchronously in protected mode', async () => {
    values.CHAOS_PROTECTION_ENABLED = 'true';
    const interceptor = new LatencyChaosInterceptor(configService);
    const startedAt = Date.now();

    const response = interceptor.intercept(context, next);
    const synchronousElapsed = Date.now() - startedAt;

    expect(synchronousElapsed).toBeLessThan(15);
    await expect(lastValueFrom(response)).resolves.toEqual({ status: 'ok' });
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(15);
  });
});
