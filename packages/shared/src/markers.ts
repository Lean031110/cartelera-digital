import type { ThemeTokens } from './theme.js';

/**
 * Resolution of `{theme.*}` and `{var.*}` markers (spec §7.2). Runs on the
 * player, so it must not depend on modern APIs; missing markers resolve to an
 * empty string and are reported so the caller can log a warning.
 */

export type Variables = Record<string, string | number | boolean>;

export interface MarkerResolution {
  value: string;
  /** Marker names that could not be resolved, e.g. `["var.menu_dia"]`. */
  missing: string[];
}

const THEME_RE = /\{theme\.([A-Za-z0-9_]+)\}/g;
const VAR_RE = /\{var\.([A-Za-z0-9_]+)\}/g;

function replaceMarker(
  input: string,
  re: RegExp,
  namespace: string,
  lookup: (key: string) => string | null,
  missing: string[],
): string {
  return input.replace(re, (_match: string, key: string) => {
    const resolved = lookup(key);
    if (resolved === null) {
      missing.push(namespace + '.' + key);
      return '';
    }
    return resolved;
  });
}

export function resolveMarkers(
  input: string,
  theme: Partial<ThemeTokens>,
  variables: Variables,
): MarkerResolution {
  const missing: string[] = [];
  const themeRecord = theme as Record<string, string | number | undefined>;
  const value = replaceMarker(
    replaceMarker(
      input,
      THEME_RE,
      'theme',
      (key) => {
        const v = themeRecord[key];
        return v === undefined || v === null ? null : String(v);
      },
      missing,
    ),
    VAR_RE,
    'var',
    (key) => {
      const v = variables[key];
      return v === undefined || v === null ? null : String(v);
    },
    missing,
  );
  return { value, missing };
}
