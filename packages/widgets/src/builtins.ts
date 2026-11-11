import { z } from 'zod';
import { createWidgetRegistry, type WidgetDefinition, type WidgetRegistry } from './registry.js';

/** Built-in widgets available from day one (props mirror spec §7.2). */

export const textWidget: WidgetDefinition = {
  type: 'text',
  label: 'Texto',
  icon: 'type',
  propsSchema: z.object({
    paragraphs: z
      .array(
        z.object({
          runs: z
            .array(
              z.object({
                text: z.string(),
                bold: z.boolean().optional(),
                italic: z.boolean().optional(),
                underline: z.boolean().optional(),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
  }),
};

export const clockWidget: WidgetDefinition = {
  type: 'clock',
  label: 'Hora',
  icon: 'clock',
  propsSchema: z.object({
    format: z.enum(['HH:mm', 'HH:mm:ss']),
    showSeconds: z.boolean(),
    align: z.enum(['left', 'center', 'right']),
  }),
};

export const imageWidget: WidgetDefinition = {
  type: 'image',
  label: 'Imagen',
  icon: 'image',
  propsSchema: z.object({
    mediaId: z.string().min(1),
    fit: z.enum(['contain', 'cover', 'fill']),
  }),
};

export const menuWidget: WidgetDefinition = {
  type: 'menu',
  label: 'Carta',
  icon: 'utensils',
  propsSchema: z.object({
    menuId: z.string().min(1),
    layout: z.enum(['columns', 'rows', 'grid']),
    columns: z.number().int().min(1).max(4),
    overflow: z.enum(['truncate', 'paginate']),
    pageSeconds: z.number().positive(),
    soldOut: z.enum(['dim', 'hide', 'badge']),
  }),
};

export const playlistWidget: WidgetDefinition = {
  type: 'playlist',
  label: 'Lista (vídeos/imágenes)',
  icon: 'clapperboard',
  propsSchema: z.object({
    playlistId: z.string().min(1),
    muted: z.boolean(),
    fit: z.enum(['contain', 'cover', 'fill']),
  }),
};

/** Registry preloaded with every built-in widget. */
export function createDefaultRegistry(): WidgetRegistry {
  const registry = createWidgetRegistry();
  const builtins = [textWidget, clockWidget, imageWidget, menuWidget, playlistWidget];
  for (const def of builtins) {
    registry.register(def);
  }
  return registry;
}
