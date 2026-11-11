import os from 'node:os';
import path from 'node:path';
import { defineConfig } from '@playwright/test';

const PORT = 8090;
const dataDir = path.join(os.tmpdir(), 'cartelera-e2e-data');

/**
 * End-to-end smoke of the walking skeleton (F0): boots the real server with
 * the built admin and player bundles.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  webServer: {
    command: 'node ../apps/server/dist/main.js',
    url: `http://127.0.0.1:${PORT}/healthz`,
    env: { PORT: String(PORT), DATA_DIR: dataDir, LOG_LEVEL: 'warn' },
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
