import { z } from 'zod';

/**
 * Layout JSON contract, schemaVersion 1 (spec §7.2).
 *
 * Forward compatibility rule: the player ignores unknown props, so this schema
 * lives in `shared` with a migration chain keyed by `schemaVersion`.
 */

export const LAYOUT_SCHEMA_VERSION = 1;
export const MAX_LAYOUT_ELEMENTS = 200;
export const MAX_LAYOUT_BYTES = 1024 * 1024;

/** `HH:mm` (24h). */
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Debe tener formato HH:mm');
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;

export const frameSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  z: z.number().int().default(0),
  rotation: z.number().min(0).max(360).default(0),
  opacity: z.number().min(0).max(1).default(1),
});
export type Frame = z.infer<typeof frameSchema>;

export const visibilitySchema = z.object({
  /** Days of week, Mon = 1 … Sun = 7. Empty/omitted = every day. */
  days: z.array(z.number().int().min(1).max(7)).optional(),
  from: timeOfDaySchema.optional(),
  to: timeOfDaySchema.optional(),
});
export type Visibility = z.infer<typeof visibilitySchema>;

export const elementStyleSchema = z.object({
  color: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  backgroundColor: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
});
export type ElementStyle = z.infer<typeof elementStyleSchema>;

/** Rich text is stored as a structure, never raw HTML (spec §7.2). */
export const textRunSchema = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  color: z.string().optional(),
  size: z.number().positive().optional(),
});
export type TextRun = z.infer<typeof textRunSchema>;

export const textParagraphSchema = z.object({
  runs: z.array(textRunSchema).min(1),
  align: z.enum(['left', 'center', 'right']).optional(),
});
export type TextParagraph = z.infer<typeof textParagraphSchema>;

const baseElementFields = {
  id: z.string().min(1),
  name: z.string().min(1),
  frame: frameSchema,
  style: elementStyleSchema.optional(),
  visibility: visibilitySchema.optional(),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
} as const;

export const imageElementSchema = z.object({
  ...baseElementFields,
  type: z.literal('image'),
  props: z.object({
    mediaId: z.string().min(1),
    fit: z.enum(['contain', 'cover', 'fill']).default('contain'),
  }),
});

export const clockElementSchema = z.object({
  ...baseElementFields,
  type: z.literal('clock'),
  props: z.object({
    format: z.enum(['HH:mm', 'HH:mm:ss']).default('HH:mm'),
    showSeconds: z.boolean().default(false),
    align: z.enum(['left', 'center', 'right']).default('right'),
  }),
});

export const menuElementSchema = z.object({
  ...baseElementFields,
  type: z.literal('menu'),
  props: z.object({
    menuId: z.string().min(1),
    layout: z.enum(['columns', 'rows', 'grid']).default('columns'),
    columns: z.number().int().min(1).max(4).default(2),
    overflow: z.enum(['truncate', 'paginate']).default('paginate'),
    pageSeconds: z.number().positive().default(12),
    soldOut: z.enum(['dim', 'hide', 'badge']).default('dim'),
  }),
});

export const playlistElementSchema = z.object({
  ...baseElementFields,
  type: z.literal('playlist'),
  props: z.object({
    playlistId: z.string().min(1),
    muted: z.boolean().default(true),
    fit: z.enum(['contain', 'cover', 'fill']).default('cover'),
  }),
});

export const textElementSchema = z.object({
  ...baseElementFields,
  type: z.literal('text'),
  props: z.object({
    paragraphs: z.array(textParagraphSchema).min(1),
  }),
});

export const layoutElementSchema = z.discriminatedUnion('type', [
  imageElementSchema,
  clockElementSchema,
  menuElementSchema,
  playlistElementSchema,
  textElementSchema,
]);
export type LayoutElement = z.infer<typeof layoutElementSchema>;

export const canvasSchema = z.object({
  width: z.number().int().min(64).max(16384),
  height: z.number().int().min(64).max(16384),
  background: z
    .object({ type: z.literal('color'), value: z.string().min(1) })
    .default({ type: 'color', value: '{theme.bg}' }),
});
export type Canvas = z.infer<typeof canvasSchema>;

export const layoutSchema = z.object({
  schemaVersion: z.literal(LAYOUT_SCHEMA_VERSION),
  id: z.string().min(1),
  name: z.string().min(1),
  canvas: canvasSchema,
  themeId: z.string().min(1).optional(),
  elements: z.array(layoutElementSchema).max(MAX_LAYOUT_ELEMENTS),
});
export type Layout = z.infer<typeof layoutSchema>;

const encoder = new TextEncoder();

/** Serialized size of a layout in bytes, against the 1 MiB limit (spec §7.2). */
export function layoutByteSize(layout: unknown): number {
  return encoder.encode(JSON.stringify(layout)).length;
}

export type LayoutValidation = { ok: true; layout: Layout } | { ok: false; error: string };

/**
 * Validates a layout against the contract and the size/element limits.
 * Returns a single human-readable error in Spanish (used by the editor).
 */
export function validateLayout(input: unknown): LayoutValidation {
  const parsed = layoutSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
      .join('; ');
    return { ok: false, error: `Diseño no válido: ${issues}` };
  }
  if (layoutByteSize(parsed.data) > MAX_LAYOUT_BYTES) {
    return { ok: false, error: `El diseño supera el límite de ${MAX_LAYOUT_BYTES} bytes` };
  }
  return { ok: true, layout: parsed.data };
}
