import type { z } from 'zod';

/**
 * Widget registry (spec §6.2, §8): each widget declares its props schema,
 * its Spanish label for the editor palette and its icon. Editor forms are
 * generated from the schemas; runtimes plug in during F2/F3.
 */

export interface WidgetDefinition {
  /** Element type, matching the layout contract (spec §7.2). */
  type: string;
  /** Spanish label shown in the editor palette. */
  label: string;
  /** Props schema; the editor generates its form from it. */
  propsSchema: z.ZodType;
  /** lucide icon name for the palette (optional). */
  icon?: string;
}

export interface WidgetRegistry {
  register(def: WidgetDefinition): void;
  get(type: string): WidgetDefinition | undefined;
  list(): WidgetDefinition[];
}

export function createWidgetRegistry(): WidgetRegistry {
  const byType = new Map<string, WidgetDefinition>();
  return {
    register(def: WidgetDefinition): void {
      if (byType.has(def.type)) {
        throw new Error(`Ya existe un widget con el tipo "${def.type}"`);
      }
      byType.set(def.type, def);
    },
    get(type: string): WidgetDefinition | undefined {
      return byType.get(type);
    },
    list(): WidgetDefinition[] {
      return Array.from(byType.values()).sort((a, b) =>
        a.label < b.label ? -1 : a.label > b.label ? 1 : 0,
      );
    },
  };
}
