import { describe, expect, it } from 'vitest';
import { computeFitTransform, formatClock, pad2 } from '../src/clock.js';

describe('pad2', () => {
  it('rellena a dos dígitos', () => {
    expect(pad2(0)).toBe('00');
    expect(pad2(9)).toBe('09');
    expect(pad2(10)).toBe('10');
    expect(pad2(59)).toBe('59');
  });
});

describe('formatClock', () => {
  it('formatea HH:mm sin segundos', () => {
    expect(formatClock(new Date(2026, 10, 9, 9, 5, 3), false)).toBe('09:05');
  });

  it('formatea HH:mm:ss con segundos', () => {
    expect(formatClock(new Date(2026, 10, 9, 23, 59, 59), true)).toBe('23:59:59');
  });
});

describe('computeFitTransform', () => {
  it('escala 1:1 y centra en una ventana idéntica', () => {
    const t = computeFitTransform(1920, 1080, 1920, 1080);
    expect(t.scale).toBe(1);
    expect(t.x).toBe(0);
    expect(t.y).toBe(0);
  });

  it('reduce a la mitad y centra (mitad de ventana)', () => {
    const t = computeFitTransform(1920, 1080, 960, 540);
    expect(t.scale).toBe(0.5);
    expect(t.x).toBe(0);
    expect(t.y).toBe(0);
  });

  it('centra con bandas laterales en ventana ancha', () => {
    const t = computeFitTransform(1920, 1080, 3840, 1080);
    expect(t.scale).toBe(1);
    expect(t.x).toBe(960);
    expect(t.y).toBe(0);
  });
});
