import { z } from 'zod';

/**
 * Theme tokens (spec §7.2). Values may be raw CSS values or contain markers
 * such as `{theme.bg}` when referenced from element styles.
 */
export const themeTokensSchema = z.object({
  bg: z.string().min(1),
  surface: z.string().min(1),
  text: z.string().min(1),
  textMuted: z.string().min(1),
  primary: z.string().min(1),
  accent: z.string().min(1),
  danger: z.string().min(1),
  fontHeading: z.string().min(1),
  fontBody: z.string().min(1),
  radius: z.number().min(0),
});

export type ThemeTokens = z.infer<typeof themeTokensSchema>;

/** Built-in dark theme used by the waiting screen and as a safe fallback. */
export const DEFAULT_THEME: ThemeTokens = {
  bg: '#0b0f19',
  surface: '#151b2b',
  text: '#f2f5fa',
  textMuted: '#8b94a7',
  primary: '#3b82f6',
  accent: '#22d3ee',
  danger: '#ef4444',
  fontHeading: "'Noto Sans SC', 'Segoe UI', sans-serif",
  fontBody: "'Noto Sans SC', 'Segoe UI', sans-serif",
  radius: 12,
};
