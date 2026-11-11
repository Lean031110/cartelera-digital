import { describe, expect, it } from 'vitest';
import {
  LAYOUT_SCHEMA_VERSION,
  layoutByteSize,
  layoutSchema,
  newId,
  validateLayout,
  type Layout,
} from '../src/index.js';

/** Example adapted from spec §7.2. */
const exampleLayout: unknown = {
  schemaVersion: LAYOUT_SCHEMA_VERSION,
  id: '01JC8Z5K3W9V2M6T4H7Q1N0BXE',
  name: 'Carta horizontal (almuerzo)',
  canvas: { width: 1920, height: 1080, background: { type: 'color', value: '{theme.bg}' } },
  themeId: '01JC8Z0000THEMEBASE000000',
  elements: [
    {
      id: 'el_logo',
      type: 'image',
      name: 'Logo',
      frame: { x: 60, y: 40, w: 260, h: 120, z: 10, rotation: 0, opacity: 1 },
      props: { mediaId: '01JC8Z1MEDIA0LOGO00000000', fit: 'contain' },
    },
    {
      id: 'el_hora',
      type: 'clock',
      name: 'Hora',
      frame: { x: 1540, y: 40, w: 320, h: 120, z: 10 },
      props: { format: 'HH:mm', showSeconds: false, align: 'right' },
      style: { color: '{theme.text}', fontFamily: '{theme.fontHeading}', fontSize: 72 },
    },
    {
      id: 'el_carta',
      type: 'menu',
      name: 'Carta',
      frame: { x: 60, y: 200, w: 1100, h: 820, z: 5 },
      props: {
        menuId: '01JC8Z2MENU000ALMUERZO00',
        layout: 'columns',
        columns: 2,
        overflow: 'paginate',
        pageSeconds: 12,
        soldOut: 'dim',
      },
    },
    {
      id: 'el_video',
      type: 'playlist',
      name: 'Promociones',
      frame: { x: 1200, y: 200, w: 660, h: 440, z: 5 },
      props: { playlistId: '01JC8Z3PLAYLIST00PROMO00', muted: true, fit: 'cover' },
    },
    {
      id: 'el_info',
      type: 'text',
      name: 'Aviso',
      frame: { x: 1200, y: 680, w: 660, h: 340, z: 5 },
      props: {
        paragraphs: [
          { runs: [{ text: 'Menú del día: {var.menu_dia}', bold: true }], align: 'left' },
        ],
      },
      visibility: { days: [1, 2, 3, 4, 5], from: '12:00', to: '16:00' },
    },
  ],
};

describe('layoutSchema', () => {
  it('acepta el ejemplo de la especificación §7.2', () => {
    const result = validateLayout(exampleLayout);
    expect(result.ok).toBe(true);
  });

  it('aplica los valores por defecto (locked, hidden, z, opacity)', () => {
    const parsed = layoutSchema.parse({
      schemaVersion: 1,
      id: 'L1',
      name: 'Prueba',
      canvas: { width: 1920, height: 1080 },
      elements: [
        {
          id: 'e1',
          type: 'text',
          name: 'T',
          frame: { x: 0, y: 0, w: 10, h: 10 },
          props: { paragraphs: [{ runs: [{ text: 'hola' }] }] },
        },
      ],
    });
    const el = parsed.elements[0]!;
    expect(el.locked).toBe(false);
    expect(el.hidden).toBe(false);
    expect(el.frame.z).toBe(0);
    expect(el.frame.opacity).toBe(1);
    expect(parsed.canvas.background.value).toBe('{theme.bg}');
  });

  it('rechaza más de 200 elementos', () => {
    const elements = Array.from({ length: 201 }, (_, i) => ({
      id: `e${i}`,
      type: 'text',
      name: `T${i}`,
      frame: { x: 0, y: 0, w: 10, h: 10 },
      props: { paragraphs: [{ runs: [{ text: 'x' }] }] },
    }));
    const result = validateLayout({
      schemaVersion: 1,
      id: 'L2',
      name: 'Demasiados',
      canvas: { width: 1920, height: 1080 },
      elements,
    });
    expect(result.ok).toBe(false);
  });

  it('rechaza lienzos fuera de rango', () => {
    const result = validateLayout({
      schemaVersion: 1,
      id: 'L3',
      name: 'Lienzo inválido',
      canvas: { width: 10, height: 1080 },
      elements: [],
    });
    expect(result.ok).toBe(false);
  });

  it('rechaza tipos de elemento desconocidos', () => {
    const result = validateLayout({
      schemaVersion: 1,
      id: 'L4',
      name: 'Tipo desconocido',
      canvas: { width: 1920, height: 1080 },
      elements: [
        { id: 'e1', type: 'hologram', name: 'X', frame: { x: 0, y: 0, w: 10, h: 10 }, props: {} },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it('rechaza visibilidades con hora mal formada', () => {
    const result = validateLayout({
      schemaVersion: 1,
      id: 'L5',
      name: 'Hora mala',
      canvas: { width: 1920, height: 1080 },
      elements: [
        {
          id: 'e1',
          type: 'text',
          name: 'T',
          frame: { x: 0, y: 0, w: 10, h: 10 },
          props: { paragraphs: [{ runs: [{ text: 'x' }] }] },
          visibility: { from: '9:30', to: '16:00' },
        },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it('aplica el límite de 1 MiB por diseño', () => {
    const huge = 'x'.repeat(1024 * 1024 + 10);
    const layout = {
      schemaVersion: 1,
      id: 'L6',
      name: 'Enorme',
      canvas: { width: 1920, height: 1080 },
      elements: [
        {
          id: 'e1',
          type: 'text',
          name: 'T',
          frame: { x: 0, y: 0, w: 10, h: 10 },
          props: { paragraphs: [{ runs: [{ text: huge }] }] },
        },
      ],
    };
    expect(layoutByteSize(layout)).toBeGreaterThan(1024 * 1024);
    const result = validateLayout(layout);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('bytes');
  });

  it('valida con un mensaje de error legible en español', () => {
    const result = validateLayout({ schemaVersion: 1, id: 'L7' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Diseño no válido');
  });
});

describe('newId', () => {
  it('genera ULID de 26 caracteres, únicos y ordenables', () => {
    const a = newId();
    const b = newId();
    expect(a).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(a).not.toBe(b);
  });
});

export type { Layout };
