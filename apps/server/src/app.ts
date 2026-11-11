import { existsSync } from 'node:fs';
import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { loadConfig, type ServerConfig } from './config.js';
import { apiRoutes } from './routes/api.js';
import { healthRoutes } from './routes/health.js';

export interface BuildAppOptions {
  config?: ServerConfig;
}

/**
 * Application factory. The container serves everything from one port
 * (DEC-01): API under /api/v1, admin SPA under /admin, player under /tv,
 * plus liveness/readiness probes.
 */
export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadConfig();
  const app = Fastify({
    logger: { level: config.logLevel },
  });

  await app.register(healthRoutes, { dataDir: config.dataDir });
  await app.register(apiRoutes, { prefix: '/api/v1' });

  app.get('/', async (_request, reply) => await reply.redirect('/admin/'));

  if (existsSync(config.adminDist)) {
    await app.register(fastifyStatic, {
      root: config.adminDist,
      prefix: '/admin/',
    });
    app.get('/admin', async (_request, reply) => await reply.redirect('/admin/'));
  }

  if (existsSync(config.playerDist)) {
    await app.register(fastifyStatic, {
      root: config.playerDist,
      prefix: '/tv/',
      decorateReply: false,
    });
    app.get('/tv', async (_request, reply) => await reply.redirect('/tv/'));
  }

  return app;
}
