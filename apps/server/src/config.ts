import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ServerConfig {
  host: string;
  port: number;
  /** Volume with SQLite DB and media (Docker: /data). */
  dataDir: string;
  logLevel: string;
  /** Built admin SPA (served at /admin). */
  adminDist: string;
  /** Built player bundle (served at /tv). */
  playerDist: string;
}

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Resolves the monorepo root from this file, which works both from
 * `src/` (tests, dev) and `dist/` (production), and lets the Docker image
 * point ADMIN_DIST / PLAYER_DIST at the copied public folder.
 */
function repoRoot(): string {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(thisDir, '..', '..', '..');
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const root = repoRoot();
  return {
    host: env.HOST ?? '0.0.0.0',
    port: toInt(env.PORT, 8080),
    dataDir: env.DATA_DIR ?? path.join(root, 'data'),
    logLevel: env.LOG_LEVEL ?? 'info',
    adminDist: env.ADMIN_DIST ?? path.join(root, 'apps', 'admin', 'dist'),
    playerDist: env.PLAYER_DIST ?? path.join(root, 'apps', 'player', 'dist'),
  };
}
