import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
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
  const allocateMemoryMock = jest.fn(() => ({
    allocatedMb: 1,
    protectionEnabled: true,
    retainedBlocks: 0,
    retainedBytes: 0,
    memory: {
      rss: 0,
      heapUsed: 0,
      external: 0,
    },
  }));
  const chaosService = {
    allocateMemory: allocateMemoryMock,
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
    allocateMemoryMock.mockReturnValue({
      allocatedMb: 1,
      protectionEnabled: true,
      retainedBlocks: 0,
      retainedBytes: 0,
      memory: {
        rss: 0,
        heapUsed: 0,
        external: 0,
      },
    });
  });

  it('does not affect requests without the chaos header', async () => {
    const interceptor = createInterceptor();

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ endpoint: 'unchanged' });
    expect(chaosAccessService.assertAllowed).not.toHaveBeenCalled();
  });

  it('rejects an unsupported global scenario', () => {
    headers['x-chaos-scenario'] = 'unsupported';
    const interceptor = createInterceptor();

    expect(() => interceptor.intercept(context, next)).toThrow(
      BadRequestException,
    );
    expect(chaosAccessService.assertAllowed).not.toHaveBeenCalled();
  });

  it('blocks synchronously in vulnerable latency mode', async () => {
    headers['x-chaos-scenario'] = 'latency';
    values.CHAOS_PROTECTION_ENABLED = 'false';
    const interceptor = createInterceptor();
    const startedAt = Date.now();

    const response = interceptor.intercept(context, next);
    const synchronousElapsed = Date.now() - startedAt;

    expect(synchronousElapsed).toBeGreaterThanOrEqual(15);
    await expect(lastValueFrom(response)).resolves.toEqual({
      endpoint: 'unchanged',
    });
    expect(responseHeaders['x-chaos-scenario']).toBe('latency');
  });

  it('delays asynchronously in protected latency mode', async () => {
    headers['x-chaos-scenario'] = 'latency';
    const interceptor = createInterceptor();
    const startedAt = Date.now();

    const response = interceptor.intercept(context, next);
    const synchronousElapsed = Date.now() - startedAt;
    const result = await lastValueFrom(response);

    expect(synchronousElapsed).toBeLessThan(15);
    expect(result).toEqual({ endpoint: 'unchanged' });
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(15);
    expect(chaosAccessService.assertAllowed).toHaveBeenCalledWith(request);
    expect(responseHeaders['x-chaos-scenario']).toBe('latency');
  });

  it('returns 503 on the first transient attempt in vulnerable mode', async () => {
    headers['x-chaos-scenario'] = 'transient-error';
    values.CHAOS_PROTECTION_ENABLED = 'false';
    const interceptor = createInterceptor();

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(responseHeaders['x-chaos-attempts']).toBe('1');
    expect(responseHeaders['x-chaos-scenario']).toBe('transient-error');
  });

  it('recovers the transient error in protected mode', async () => {
    headers['x-chaos-scenario'] = 'transient-error';
    const interceptor = createInterceptor();

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ endpoint: 'unchanged' });
    expect(responseHeaders['x-chaos-attempts']).toBe('2');
    expect(responseHeaders['x-chaos-scenario']).toBe('transient-error');
  });

  it('reports retained memory in vulnerable mode', async () => {
    headers['x-chaos-scenario'] = 'memory';
    values.CHAOS_PROTECTION_ENABLED = 'false';
    allocateMemoryMock.mockReturnValue({
      allocatedMb: 1,
      protectionEnabled: false,
      retainedBlocks: 1,
      retainedBytes: 1024 * 1024,
      memory: {
        rss: 0,
        heapUsed: 0,
        external: 1024 * 1024,
      },
    });
    const interceptor = createInterceptor();

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ endpoint: 'unchanged' });
    expect(allocateMemoryMock).toHaveBeenCalledTimes(1);
    expect(responseHeaders['x-chaos-retained-bytes']).toBe('1048576');
    expect(responseHeaders['x-chaos-scenario']).toBe('memory');
  });

  it('does not retain memory in protected mode', async () => {
    headers['x-chaos-scenario'] = 'memory';
    const interceptor = createInterceptor();

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({ endpoint: 'unchanged' });
    expect(allocateMemoryMock).toHaveBeenCalledTimes(1);
    expect(responseHeaders['x-chaos-retained-bytes']).toBe('0');
    expect(responseHeaders['x-chaos-scenario']).toBe('memory');
  });

  function createInterceptor() {
    return new ChaosInjectionInterceptor(
      configService,
      chaosAccessService,
      chaosService,
    );
  }
});
