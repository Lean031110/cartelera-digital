// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

describe('pantalla en espera del reproductor', () => {
  it('arranca sobre #cartelera-player-root con título, reloj y pista', async () => {
    document.body.innerHTML = '<div id="cartelera-player-root"></div>';
    await import('../src/main.js');
    const root = document.getElementById('cartelera-player-root')!;

    const title = root.querySelector('h1');
    expect(title?.textContent).toBe('Pantalla en espera');

    const clock = root.querySelector('[data-testid="clock"]');
    expect(clock?.textContent).toMatch(/^\d{2}:\d{2}$/);

    const stage = root.querySelector('#cb-stage') as HTMLElement | null;
    expect(stage?.style.width).toBe('1920px');
    expect(stage?.style.height).toBe('1080px');
    expect(stage?.style.transform).toContain('scale(');
  });
});
