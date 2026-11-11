import { describe, expect, it } from 'vitest';
import { createDefaultRegistry, createWidgetRegistry } from '../src/index.js';

describe('createWidgetRegistry', () => {
  it('registra, recupera y lista widgets', () => {
    const registry = createWidgetRegistry();
    registry.register({
      type: 'prueba',
      label: 'Prueba',
      propsSchema: { safeParse: () => ({ success: true, data: {} }) } as never,
    });
    expect(registry.get('prueba')?.label).toBe('Prueba');
    expect(registry.list().map((d) => d.type)).toEqual(['prueba']);
    expect(registry.get('inexistente')).toBeUndefined();
  });

  it('lanza error si el tipo ya existe', () => {
    const registry = createWidgetRegistry();
    const def = {
      type: 'text',
      label: 'Texto',
      propsSchema: { safeParse: () => ({ success: true, data: {} }) } as never,
    };
    registry.register(def);
    expect(() => registry.register(def)).toThrow(/Ya existe un widget/);
  });
});

describe('createDefaultRegistry', () => {
  it('incluye los cinco widgets integrados del contrato §7.2 (ordenados por etiqueta)', () => {
    const registry = createDefaultRegistry();
    const types = registry.list().map((d) => d.type);
    // Orden alfabético por etiqueta en español: Carta, Hora, Imagen, Lista, Texto.
    expect(types).toEqual(['menu', 'clock', 'image', 'playlist', 'text']);
  });

  it('los widgets integrados validan props de ejemplo', () => {
    const registry = createDefaultRegistry();
    const text = registry.get('text')!;
    expect(text.propsSchema.safeParse({ paragraphs: [{ runs: [{ text: 'Hola' }] }] }).success).toBe(
      true,
    );
    const clock = registry.get('clock')!;
    expect(
      clock.propsSchema.safeParse({ format: 'HH:mm', showSeconds: false, align: 'right' }).success,
    ).toBe(true);
  });
});
