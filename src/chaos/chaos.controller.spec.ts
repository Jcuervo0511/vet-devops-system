import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ChaosAccessService } from './chaos-access.service';
import { ChaosController } from './chaos.controller';
import { ChaosGuard } from './chaos.guard';
import { ChaosService } from './chaos.service';

describe('ChaosController', () => {
  let app: INestApplication<App>;
  let chaosService: ChaosService;
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
        ChaosAccessService,
        ChaosGuard,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    chaosService = moduleRef.get(ChaosService);
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

  it('returns the global memory status', async () => {
    const response = await request(app.getHttpServer())
      .get('/chaos/status')
      .set('x-chaos-key', 'test-key')
      .expect(200);

    expect(response.text).toContain('"retainedBlocks":0');
    expect(response.text).toContain('"retainedBytes":0');
  });

  it('clears memory retained by the global interceptor', async () => {
    values.CHAOS_PROTECTION_ENABLED = 'false';
    chaosService.allocateMemory();
    chaosService.allocateMemory();

    const response = await request(app.getHttpServer())
      .delete('/chaos/reset')
      .set('x-chaos-key', 'test-key')
      .expect(200);

    expect(response.text).toContain('"releasedBlocks":2');
    expect(response.text).toContain('"retainedBytes":0');
  });

  it.each([
    ['get', '/chaos/latency'],
    ['get', '/chaos/transient-error'],
    ['post', '/chaos/memory'],
  ] as const)(
    'does not expose the removed %s %s route',
    async (method, path) => {
      await request(app.getHttpServer())
        [method](path)
        .set('x-chaos-key', 'test-key')
        .expect(404);
    },
  );
});
