#!/usr/bin/env node
/**
 * Player bundle budget (spec §5.3): dist/tv.js must stay under 150 KB gzip.
 * Runs as part of `apps/player` build.
 */
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BUDGET_BYTES = 150 * 1024;
const bundlePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'apps',
  'player',
  'dist',
  'tv.js',
);

const raw = readFileSync(bundlePath);
const gzipped = gzipSync(raw);

process.stdout.write(
  `player bundle: ${raw.length} bytes raw, ${gzipped.length} bytes gzip (presupuesto ${BUDGET_BYTES})\n`,
);

if (gzipped.length > BUDGET_BYTES) {
  process.stderr.write('ERROR: el bundle del reproductor supera el presupuesto de 150 KB gzip\n');
  process.exit(1);
}
