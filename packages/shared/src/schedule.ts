import { z } from 'zod';
import { timeOfDaySchema } from './layout.js';

/**
 * Pure schedule resolution (spec §7.3). The same function runs on the server
 * (calendar preview) and in the player (playback and offline mode).
 *
 * Design constraints:
 * - Deterministic: equal inputs always produce equal output.
 * - No `Intl`, no timezone database (player rule, spec §5.3). Callers pass
 *   wall-clock milliseconds for the screen (`localMs`), i.e. what the local
 *   time would read if it were expressed as UTC.
 * - Schedule-entry date ranges (`startsAt`/`endsAt`) are compared against
 *   `localMs` (local wall-clock epochs). Overrides use absolute `nowMs`
 *   windows: an override is an emergency interruption pinned to real instants.
 */

export const scheduleTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('screen'), screenId: z.string().min(1) }),
  z.object({ kind: z.literal('group'), groupId: z.string().min(1) }),
  z.object({ kind: z.literal('all') }),
]);
export type ScheduleTarget = z.infer<typeof scheduleTargetSchema>;

export const scheduleEntrySchema = z.object({
  id: z.string().min(1),
  target: scheduleTargetSchema,
  layoutId: z.string().min(1),
  priority: z.number().int().default(0),
  /** Local wall-clock epoch ms, inclusive. `null` = open start. */
  startsAt: z.number().nullable().default(null),
  /** Local wall-clock epoch ms, exclusive. `null` = open end. */
  endsAt: z.number().nullable().default(null),
  /** Mon = 1 … Sun = 7. `null`/empty = every day. */
  days: z.array(z.number().int().min(1).max(7)).nullable().default(null),
  /** `HH:mm`. `null` = start of day. */
  fromTime: timeOfDaySchema.nullable().default(null),
  /** `HH:mm`. `null` = end of day. */
  toTime: timeOfDaySchema.nullable().default(null),
  enabled: z.boolean().default(true),
  createdAt: z.number(),
});
export type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;

export const scheduleOverrideSchema = z.object({
  id: z.string().min(1),
  target: scheduleTargetSchema,
  layoutId: z.string().min(1),
  /** Absolute epoch ms, inclusive. */
  startsAt: z.number(),
  /** Absolute epoch ms, exclusive. */
  endsAt: z.number(),
  createdAt: z.number(),
});
export type ScheduleOverride = z.infer<typeof scheduleOverrideSchema>;

export interface ResolveScheduleInput {
  screenId: string;
  groupId: string | null;
  entries: ScheduleEntry[];
  overrides: ScheduleOverride[];
  defaultLayoutId: string | null;
}

export interface ResolveScheduleContext {
  /** True epoch ms. Used for overrides and `now`. */
  nowMs: number;
  /** Wall-clock ms in the screen's timezone (used for day/time windows). */
  localMs: number;
}

export type ScheduleDecision =
  | { layoutId: string; reason: 'override'; overrideId: string }
  | { layoutId: string; reason: 'entry'; entryId: string }
  | { layoutId: string; reason: 'default' }
  | { layoutId: null; reason: 'none' };

const DAY_MS = 86400000;
const DAY_MINUTES = 1440;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** `('HH:mm') -> minutes since midnight`, or `null` if malformed. */
export function parseHHMM(value: string): number | null {
  const match = TIME_RE.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Mon = 1 … Sun = 7, from local wall-clock ms. */
function weekdayOfLocalMs(localMs: number): number {
  const dow = new Date(localMs).getUTCDay(); // 0 = Sun … 6 = Sat
  return dow === 0 ? 7 : dow;
}

/** Minutes since midnight, from local wall-clock ms. */
function minutesOfLocalMs(localMs: number): number {
  const ms = ((localMs % DAY_MS) + DAY_MS) % DAY_MS;
  return Math.floor(ms / 60000);
}

function targetMatches(target: ScheduleTarget, screenId: string, groupId: string | null): boolean {
  if (target.kind === 'all') return true;
  if (target.kind === 'screen') return target.screenId === screenId;
  return groupId !== null && target.groupId === groupId;
}

/** screen > group > all. */
function targetSpecificity(target: ScheduleTarget): number {
  if (target.kind === 'screen') return 3;
  if (target.kind === 'group') return 2;
  return 1;
}

/** Total minutes of the entry's daily window (used as the "narrower wins" tie-break). */
function windowMinutes(entry: ScheduleEntry): number {
  const from = entry.fromTime !== null ? (parseHHMM(entry.fromTime) ?? 0) : 0;
  const to = entry.toTime !== null ? (parseHHMM(entry.toTime) ?? DAY_MINUTES) : DAY_MINUTES;
  return from <= to ? to - from : DAY_MINUTES - from + to;
}

function entryActiveAt(entry: ScheduleEntry, ctx: ResolveScheduleContext): boolean {
  if (!entry.enabled) return false;
  const { localMs } = ctx;
  if (entry.startsAt !== null && localMs < entry.startsAt) return false;
  if (entry.endsAt !== null && localMs >= entry.endsAt) return false;

  const from = entry.fromTime !== null ? parseHHMM(entry.fromTime) : 0;
  const to = entry.toTime !== null ? parseHHMM(entry.toTime) : DAY_MINUTES;
  if (from === null || to === null) return false;

  const nowMin = minutesOfLocalMs(localMs);
  const daysSet = entry.days !== null && entry.days.length > 0 ? new Set(entry.days) : null;

  if (from <= to) {
    // Window inside one day (or the whole day when both bounds are null).
    if (nowMin < from || nowMin >= to) return false;
    if (daysSet !== null) {
      const day = weekdayOfLocalMs(localMs);
      if (!daysSet.has(day)) return false;
    }
    return true;
  }

  // Window crossing midnight, e.g. 22:00–02:00 → two segments (spec §7.3.2).
  const inLateSegment = nowMin >= from; // before midnight, e.g. 23:10
  const inEarlySegment = nowMin < to; // after midnight, e.g. 01:30
  if (!inLateSegment && !inEarlySegment) return false;
  if (daysSet !== null) {
    if (inLateSegment) {
      const day = weekdayOfLocalMs(localMs);
      if (!daysSet.has(day)) return false;
    }
    if (inEarlySegment) {
      const yesterday = weekdayOfLocalMs(localMs - DAY_MS);
      if (!daysSet.has(yesterday)) return false;
    }
  }
  return true;
}

function byId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Decides which layout a screen must render (spec §7.3):
 * 1. Active overrides (most specific target wins, then most recent).
 * 2. Active schedule entries (priority desc → narrower window → newest).
 * 3. `defaultLayoutId`.
 * 4. `none` → the player shows the built-in waiting layout.
 */
export function resolveSchedule(
  input: ResolveScheduleInput,
  ctx: ResolveScheduleContext,
): ScheduleDecision {
  const override = input.overrides
    .filter(
      (o) =>
        o.startsAt <= ctx.nowMs &&
        ctx.nowMs < o.endsAt &&
        targetMatches(o.target, input.screenId, input.groupId),
    )
    .sort(
      (a, b) =>
        targetSpecificity(b.target) - targetSpecificity(a.target) ||
        b.createdAt - a.createdAt ||
        byId(a, b),
    )[0];
  if (override !== undefined) {
    return { layoutId: override.layoutId, reason: 'override', overrideId: override.id };
  }

  const entry = input.entries
    .filter((e) => entryActiveAt(e, ctx) && targetMatches(e.target, input.screenId, input.groupId))
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        windowMinutes(a) - windowMinutes(b) ||
        b.createdAt - a.createdAt ||
        byId(a, b),
    )[0];
  if (entry !== undefined) {
    return { layoutId: entry.layoutId, reason: 'entry', entryId: entry.id };
  }

  if (input.defaultLayoutId !== null) {
    return { layoutId: input.defaultLayoutId, reason: 'default' };
  }
  return { layoutId: null, reason: 'none' };
}
