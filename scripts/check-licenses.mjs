#!/usr/bin/env node
/**
 * Dependency license check (spec §4.3).
 *
 * Walks the pnpm store (node_modules/.pnpm) and collects the declared
 * license of every installed package. Fails when a license is forbidden
 * (GPL/AGPL/SSPL/NC/commercial) or unknown, and generates
 * THIRD_PARTY_NOTICES.md.
 *
 *   node scripts/check-licenses.mjs --check   → CI: además exige que el fichero esté al día
 *   node scripts/check-licenses.mjs --write   → regenera THIRD_PARTY_NOTICES.md
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STORE = path.join(ROOT, 'node_modules', '.pnpm');
const OUT = path.join(ROOT, 'THIRD_PARTY_NOTICES.md');

/** Permissive licenses accepted for dependencies (spec §4.3). */
const ALLOWED = new Set([
  'MIT',
  'ISC',
  '0BSD',
  'BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BSD-2-Clause-FreeBSD',
  'BSD-3-Clause-Clear',
  'Apache-2.0',
  'CC0-1.0',
  'Unlicense',
  'BlueOak-1.0.0',
  'Zlib',
  'Python-2.0',
  // Datos de compatibilidad de navegadores (browserslist); atribución, sin copyleft.
  'CC-BY-4.0',
  // Copyleft débil a nivel de fichero (Tailwind v4 → lightningcss). Usarlas como
  // dependencia sin modificar no obliga a relicenciar este proyecto.
  'MPL-2.0',
]);

/** Licenses explicitly rejected, regardless of combination. */
const FORBIDDEN = [/GPL/i, /SSPL/i, /NC\b/, /CC-BY-NC/, /BUSL/, /commercial/i, /proprietary/i];

/** Packages whose `license` field is unreliable but whose real license is fine. */
const REVIEWED = {
  // None so far. Each entry needs a justification comment.
};

function normalizeLicenseField(pkg) {
  const field = pkg.license;
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) {
    return field
      .map((entry) => (typeof entry === 'string' ? entry : (entry.type ?? '?')))
      .join(' OR ');
  }
  if (field !== null && typeof field === 'object' && typeof field.type === 'string') {
    return field.type;
  }
  return pkg.licenses !== undefined ? normalizeLicenseField({ license: pkg.licenses }) : 'UNKNOWN';
}

function expressionTokens(expression) {
  return expression
    .split(/\s*(?:OR|AND|,|\|\||\/)\s*/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function collect() {
  const packages = new Map();
  if (!existsSync(STORE)) {
    return { packages, errors: ['No existe node_modules/.pnpm: ejecuta pnpm install primero'] };
  }
  for (const entry of readdirSync(STORE)) {
    if (entry.startsWith('.') || !entry.includes('@')) continue;
    const at = entry.lastIndexOf('@');
    const pkgName = at <= 0 ? entry : entry.slice(0, at).replace(/\+/, '/');
    const inner = path.join(STORE, entry, 'node_modules', pkgName, 'package.json');
    if (!existsSync(inner)) continue;
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(inner, 'utf8'));
    } catch {
      continue;
    }
    if (pkg.private === true) continue;
    const key = `${pkg.name ?? pkgName}@${pkg.version ?? '?'}`;
    packages.set(key, {
      name: pkg.name ?? pkgName,
      version: pkg.version ?? '?',
      license: REVIEWED[key.split('@')[0]] ?? normalizeLicenseField(pkg),
      homepage: pkg.homepage ?? null,
      repository:
        typeof pkg.repository === 'string' ? pkg.repository : (pkg.repository?.url ?? null),
    });
  }
  return { packages, errors: [] };
}

function verdict(license) {
  const tokens = expressionTokens(license);
  for (const token of tokens) {
    if (FORBIDDEN.some((re) => re.test(token))) return 'forbidden';
  }
  if (tokens.some((token) => ALLOWED.has(token))) return 'allowed';
  return 'unknown';
}

function render(packages) {
  const lines = [];
  lines.push('# Avisos de terceros (THIRD_PARTY_NOTICES)');
  lines.push('');
  lines.push(
    'Dependencias instaladas del monorepo `cartelera-digital` y sus licencias, ' +
      'generado automáticamente por `scripts/check-licenses.mjs`. Licencias permitidas: ' +
      'MIT, ISC, BSD, Apache-2.0 y equivalentes permisivas. Prohibidas: GPL, AGPL, SSPL ' +
      'y comerciales (guía §4.3).',
  );
  lines.push('');
  const byLicense = new Map();
  for (const info of [...packages.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    const list = byLicense.get(info.license) ?? [];
    list.push(info);
    byLicense.set(info.license, list);
  }
  for (const license of [...byLicense.keys()].sort()) {
    lines.push(`## ${license}`);
    lines.push('');
    for (const info of byLicense.get(license)) {
      const link = info.homepage ?? info.repository;
      lines.push(`- ${info.name}@${info.version}${link !== null ? ` — ${link}` : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

const mode = process.argv.includes('--write') ? 'write' : 'check';
const { packages, errors } = collect();

const problems = [...errors];
for (const info of packages.values()) {
  const result = verdict(info.license);
  if (result === 'forbidden') {
    problems.push(`LICENCIA PROHIBIDA: ${info.name}@${info.version} → ${info.license}`);
  } else if (result === 'unknown') {
    problems.push(
      `LICENCIA DESCONOCIDA: ${info.name}@${info.version} → "${info.license}" (revisar)`,
    );
  }
}

const content = render(packages);

if (problems.length > 0) {
  process.stderr.write(problems.join('\n') + '\n');
  process.exit(1);
}

if (mode === 'write') {
  writeFileSync(OUT, content);
  process.stdout.write(`THIRD_PARTY_NOTICES.md actualizado (${packages.size} paquetes)\n`);
} else {
  if (!existsSync(OUT)) {
    process.stderr.write('THIRD_PARTY_NOTICES.md no existe: ejecuta pnpm licenses:update\n');
    process.exit(1);
  }
  const current = readFileSync(OUT, 'utf8');
  if (current !== content) {
    process.stderr.write(
      'THIRD_PARTY_NOTICES.md está desactualizado: ejecuta pnpm licenses:update y haz commit\n',
    );
    process.exit(1);
  }
  process.stdout.write(`Licencias revisadas: ${packages.size} paquetes, todas permitidas\n`);
}
