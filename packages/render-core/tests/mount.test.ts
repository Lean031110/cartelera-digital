import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_THEME, type Layout } from '@cartelera/shared';
import { applyThemeVars, mountLayout } from '../src/index.js';

// Entorno jsdom global (vitest.config.ts); el motor es DOM puro.

function host(): HTMLElement {
  const el = document.getElementById('host')!;
  el.innerHTML = '';
  return el;
}

function textLayout(): Layout {
  return {
    schemaVersion: 1,
    id: 'L1',
    name: 'Prueba',
    canvas: { width: 1920, height: 1080, background: { type: 'color', value: '{theme.bg}' } },
    themeId: undefined,
    elements: [
      {
        id: 'el_info',
        type: 'text',
        name: 'Aviso',
        frame: { x: 1200, y: 680, w: 660, h: 340, z: 5, rotation: 0, opacity: 1 },
        props: {
          paragraphs: [
            { runs: [{ text: 'Menú del día: {var.menu_dia}', bold: true }], align: 'left' },
            { runs: [{ text: 'Aforo {var.aforo}', italic: true, underline: true }] },
          ],
        },
        style: { color: '{theme.text}', fontSize: 48 },
        locked: false,
        hidden: false,
      },
      {
        id: 'el_reloj',
        type: 'clock',
        name: 'Hora',
        frame: { x: 1540, y: 40, w: 320, h: 120, z: 10, rotation: 0, opacity: 1 },
        props: { format: 'HH:mm', showSeconds: false, align: 'right' },
        locked: false,
        hidden: false,
      },
      {
        id: 'el_oculto',
        type: 'image',
        name: 'Logo oculto',
        frame: { x: 60, y: 40, w: 260, h: 120, z: 1, rotation: 0, opacity: 1 },
        props: { mediaId: 'M1', fit: 'contain' },
        locked: false,
        hidden: true,
      },
    ],
  };
}

describe('mountLayout', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
  });

  it('crea un escenario del tamaño del lienzo con el fondo resuelto', () => {
    const container = host();
    const handle = mountLayout(container, textLayout(), {
      theme: DEFAULT_THEME,
      variables: { menu_dia: 'Cocido', aforo: 42 },
    });
    expect(handle.root.className).toBe('cb-stage');
    expect(handle.root.style.width).toBe('1920px');
    expect(handle.root.style.height).toBe('1080px');
    // jsdom normaliza el color hexadecimal a rgb().
    expect(handle.root.style.backgroundColor).toBe('rgb(11, 15, 25)');
    handle.destroy();
  });

  it('posiciona cada elemento en píxeles de diseño y respeta z', () => {
    const container = host();
    const handle = mountLayout(container, textLayout(), {
      theme: DEFAULT_THEME,
      variables: {},
    });
    const info = handle.shells.get('el_info')!;
    expect(info.style.left).toBe('1200px');
    expect(info.style.top).toBe('680px');
    expect(info.style.width).toBe('660px');
    expect(info.style.height).toBe('340px');
    expect(info.style.zIndex).toBe('5');
    expect(handle.shells.get('el_reloj')!.style.zIndex).toBe('10');
    handle.destroy();
  });

  it('monta el texto como estructura (runs con negrita/cursiva) sin HTML crudo', () => {
    const container = host();
    const handle = mountLayout(container, textLayout(), {
      theme: DEFAULT_THEME,
      variables: { menu_dia: 'Cocido madrileño', aforo: 42 },
    });
    const info = handle.shells.get('el_info')!;
    const strong = info.querySelector('strong');
    expect(strong?.textContent).toContain('Menú del día: Cocido madrileño');
    const em = info.querySelector('em u, u em');
    expect(em?.textContent).toBe('Aforo 42');
    expect(info.textContent).toContain('Menú del día: Cocido madrileño');
    handle.destroy();
  });

  it('oculta los elementos marcados como hidden', () => {
    const container = host();
    const handle = mountLayout(container, textLayout(), { theme: DEFAULT_THEME, variables: {} });
    expect(handle.shells.get('el_oculto')!.style.display).toBe('none');
    handle.destroy();
  });

  it('monta un marcador de posición para widgets sin runtime aún', () => {
    const container = host();
    const handle = mountLayout(container, textLayout(), { theme: DEFAULT_THEME, variables: {} });
    const clock = handle.shells.get('el_reloj')!;
    expect(clock.querySelector('.cb-widget-placeholder')?.textContent).toBe('Hora');
    handle.destroy();
  });

  it('destroy desmonta el escenario', () => {
    const container = host();
    const handle = mountLayout(container, textLayout(), { theme: DEFAULT_THEME, variables: {} });
    expect(container.querySelector('.cb-stage')).not.toBeNull();
    handle.destroy();
    expect(container.querySelector('.cb-stage')).toBeNull();
    expect(handle.shells.size).toBe(0);
  });
});

describe('applyThemeVars', () => {
  it('publica los tokens como variables CSS --cb-*', () => {
    const el = host();
    applyThemeVars(el, DEFAULT_THEME);
    expect(el.style.getPropertyValue('--cb-bg')).toBe(DEFAULT_THEME.bg);
    expect(el.style.getPropertyValue('--cb-text')).toBe(DEFAULT_THEME.text);
    expect(el.style.getPropertyValue('--cb-radius')).toBe(`${DEFAULT_THEME.radius}px`);
  });
});
