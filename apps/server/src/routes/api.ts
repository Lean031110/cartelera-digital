import type { FastifyInstance } from 'fastify';
import { version } from '../version.js';

/**
 * Versioned REST API namespace (spec §10: the player protocol is versioned
 * from day one; auth, layouts, screens and manifests arrive in F1–F2).
 */
export async function apiRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ping', async () => ({ pong: true, version }));
}
