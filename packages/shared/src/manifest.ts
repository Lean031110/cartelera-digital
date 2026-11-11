import { z } from 'zod';
import { layoutSchema, timeOfDaySchema } from './layout.js';
import { scheduleEntrySchema, scheduleOverrideSchema } from './schedule.js';

/**
 * Screen manifest, manifestVersion 1 (spec §7.4). Complete (not a diff),
 * served compressed with an ETag equal to its hash. Prices arrive as
 * `priceText` already formatted so the player never depends on `Intl`.
 */

export const MANIFEST_PROTOCOL_VERSION = 1;
export const DEFAULT_REFRESH_AT = '04:00';

export const manifestMediaKindSchema = z.enum(['image', 'video']);
export type ManifestMediaKind = z.infer<typeof manifestMediaKindSchema>;

export const manifestSchema = z.object({
  manifestVersion: z.literal(1),
  /** `sha256:…`, changes only when something relevant to the screen changes. */
  hash: z.string().min(1),
  server: z.object({
    time: z.number(),
    protocol: z.literal(MANIFEST_PROTOCOL_VERSION),
    minPlayer: z.number().int().min(1),
  }),
  screen: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
    scaleMode: z.enum(['fit', 'fill', 'stretch']),
    timezone: z.string().min(1),
    refreshAt: timeOfDaySchema,
    muted: z.boolean(),
  }),
  /** Only the layouts used within the schedule horizon. */
  layouts: z.array(
    z.object({
      id: z.string().min(1),
      version: z.number().int().min(1),
      json: layoutSchema,
    }),
  ),
  schedule: z.object({
    horizonDays: z.number().int().min(1).max(31),
    defaultLayoutId: z.string().min(1).nullable(),
    entries: z.array(scheduleEntrySchema),
    overrides: z.array(scheduleOverrideSchema),
  }),
  media: z.array(
    z.object({
      id: z.string().min(1),
      url: z.string().min(1),
      kind: manifestMediaKindSchema,
      bytes: z.number().int().nonnegative(),
    }),
  ),
  data: z.object({
    menus: z.record(z.string(), z.unknown()),
    variables: z.record(z.string(), z.unknown()),
    sources: z.record(z.string(), z.unknown()),
  }),
});

export type Manifest = z.infer<typeof manifestSchema>;
