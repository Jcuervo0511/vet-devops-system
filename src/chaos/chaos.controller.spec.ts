import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ChaosController } from './chaos.controller';
import { ChaosGuard } from './chaos.guard';
import { ChaosService } from './chaos.service';
import { LatencyChaosInterceptor } from './interceptors/latency-chaos.interceptor';
import { Retry503Interceptor } from './interceptors/retry-503.interceptor';
import { TransientErrorInterceptor } from './interceptors/transient-error.interceptor';

describe('ChaosController', () => {
  let app: INestApplication<App>;
  const values: Record<string, string> = {};
  const configService = {
    get: jest.fn((key: string) => values[key]),
  };

  beforeEach(async () => {
    Object.assign(values, {
      CHAOS_ENABLED: 'true',
      CHAOS_PROTECTION_ENABLED: 'true',
      CHAOS_KEY: 'test-key',
      CHAOS_DELAY_MS: '10',
      CHAOS_MEMORY_MB: '1',
    });

    const moduleRef = await Test.createTestingModule({
      controllers: [ChaosController],
      providers: [
        ChaosService,
        ChaosGuard,
        LatencyChaosInterceptor,
        Retry503Interceptor,
        TransientErrorInterceptor,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('hides the routes when chaos is disabled', async () => {
    values.CHAOS_ENABLED = 'false';

    await request(app.getHttpServer())
      .get('/chaos/status')
      .set('x-chaos-key', 'test-key')
      .expect(404);
  });

  it('rejects an invalid chaos key', async () => {
    await request(app.getHttpServer())
      .get('/chaos/status')
      .set('x-chaos-key', 'wrong-key')
      .expect(403);
  });

  it('returns 503 without transient error protection', async () => {
    values.CHAOS_PROTECTION_ENABLED = 'false';

    await request(app.getHttpServer())
      .get('/chaos/transient-error')
      .set('x-chaos-key', 'test-key')
      .expect(503);
  });

  it('recovers a transient 503 with one retry', async () => {
    const response = await request(app.getHttpServer())
      .get('/chaos/transient-error')
      .set('x-chaos-key', 'test-key')
      .expect(200);

    expect(response.text).toContain('"attempts":2');
    expect(response.text).toContain('"recovered":true');
  });

  it('reports retained bytes for the memory scenario', async () => {
    values.CHAOS_PROTECTION_ENABLED = 'false';

    const response = await request(app.getHttpServer())
      .post('/chaos/memory')
      .set('x-chaos-key', 'test-key')
      .expect(201);

    expect(response.text).toContain('"retainedBytes":1048576');
  });
});
