import { accessSync, constants } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import { serviceName, version } from '../version.js';

export interface HealthPluginOptions {
  /** When set, readiness fails with 503 if this directory is not writable. */
  dataDir?: string;
}

function isWritable(dir: string): boolean {
  try {
    accessSync(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Liveness and readiness probes (spec §6.6). `/readyz` additionally checks
 * that the data volume is writable: a screen must never wait for a broken disk.
 */
export async function healthRoutes(
  app: FastifyInstance,
  options: HealthPluginOptions,
): Promise<void> {
  app.get('/healthz', async () => ({
    status: 'ok',
    service: serviceName,
    version,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: Date.now(),
  }));

  app.get('/readyz', async (_request, reply) => {
    if (options.dataDir !== undefined && !isWritable(options.dataDir)) {
      return await reply.code(503).send({
        status: 'unavailable',
        reason: `DATA_DIR (${options.dataDir}) is not writable`,
      });
    }
    return await reply.send({ status: 'ready', service: serviceName, version });
  });
}
