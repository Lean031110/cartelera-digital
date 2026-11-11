import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

// Static UI tests require the admin/player bundles to exist (run after `pnpm build`).
const defaults = loadConfig();
const adminBuilt = existsSync(defaults.adminDist);
const playerBuilt = existsSync(defaults.playerDist);
const dataDir = mkdtempSync(path.join(tmpdir(), 'cartelera-server-test-'));

describe('cartelera server (F0 walking skeleton)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ config: { ...defaults, dataDir, logLevel: 'silent' } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /healthz → 200 con estado, servicio y versión', async () => {
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('cartelera');
    expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(typeof body.uptimeSeconds).toBe('number');
  });

  it('GET /readyz → 200 cuando DATA_DIR es escribible', async () => {
    const res = await app.inject({ method: 'GET', url: '/readyz' });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('ready');
  });

  it('GET /api/v1/ping → 200 con pong', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/ping' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ pong: true, version: expect.any(String) });
  });

  it('GET / → 302 hacia /admin/', async () => {
    const res = await app.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/admin/');
  });

  it.runIf(adminBuilt)('GET /admin/ sirve el panel construido', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('id="root"');
  });

  it.runIf(playerBuilt)('GET /tv/ sirve el reproductor ES5', async () => {
    const res = await app.inject({ method: 'GET', url: '/tv/' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('cartelera-player-root');
    const js = await app.inject({ method: 'GET', url: '/tv/tv.js' });
    expect(js.statusCode).toBe(200);
    expect(js.headers['content-type']).toContain('javascript');
  });

  it('GET /api/v1/rota-no-existe → 404 JSON', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/does-not-exist' });
    expect(res.statusCode).toBe(404);
  });
});
