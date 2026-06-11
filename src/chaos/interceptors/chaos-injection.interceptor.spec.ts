import { CallHandler, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { lastValueFrom, of } from 'rxjs';
import { ChaosAccessService } from '../chaos-access.service';
import { ChaosService } from '../chaos.service';
import { ChaosInjectionInterceptor } from './chaos-injection.interceptor';

describe('ChaosInjectionInterceptor', () => {
  const values: Record<string, string> = {
    CHAOS_DELAY_MS: '20',
    CHAOS_PROTECTION_ENABLED: 'true',
  };
  const configService = {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
  const chaosAccessService = {
    assertAllowed: jest.fn(),
  } as unknown as ChaosAccessService;
  const chaosService = {
    allocateMemory: jest.fn(() => ({ retainedBytes: 0 })),
  } as unknown as ChaosService;
  const headers: Record<string, string | undefined> = {};
  const responseHeaders: Record<string, string> = {};
  const request = {
    header: jest.fn((name: string) => headers[name]),
  } as unknown as Request;
  const response = {
    setHeader: jest.fn((name: string, value: string) => {
      responseHeaders[name] = value;
    }),
  } as unknown as Response;
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
  const next: CallHandler = {
    handle: () => of({ endpoint: 'unchanged' }),
  };

  beforeEach(() => {
    headers['x-chaos-scenario'] = undefined;
    values.CHAOS_PROTECTION_ENABLED = 'true';
    Object.keys(responseHeaders).forEach((key) => delete responseHeaders[key]);
    jest.clearAllMocks();
  });

  it('does not affect requests without the chaos header', async () => {
    const interceptor = createInterceptor();

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ endpoint: 'unchanged' });
    expect(chaosAccessService.assertAllowed).not.toHaveBeenCalled();
  });

  it('injects latency without changing the endpoint response', async () => {
    headers['x-chaos-scenario'] = 'latency';
    const interceptor = createInterceptor();
    const startedAt = Date.now();

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ endpoint: 'unchanged' });
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(15);
    expect(chaosAccessService.assertAllowed).toHaveBeenCalledWith(request);
  });

  it('recovers the transient error and preserves the response', async () => {
    headers['x-chaos-scenario'] = 'transient-error';
    const interceptor = createInterceptor();

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ endpoint: 'unchanged' });
    expect(responseHeaders['x-chaos-attempts']).toBe('2');
  });

  it('injects memory without changing the endpoint response', async () => {
    headers['x-chaos-scenario'] = 'memory';
    const interceptor = createInterceptor();

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ endpoint: 'unchanged' });
    expect(chaosService.allocateMemory).toHaveBeenCalledTimes(1);
    expect(responseHeaders['x-chaos-retained-bytes']).toBe('0');
  });

  function createInterceptor() {
    return new ChaosInjectionInterceptor(
      configService,
      chaosAccessService,
      chaosService,
    );
  }
});
