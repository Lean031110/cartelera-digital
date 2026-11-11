import { describe, expect, it } from 'vitest';
import { computeTransform, transformCss } from '../src/index.js';

describe('computeTransform', () => {
  it('fit centra sin recortar con el factor mínimo (rotación 0)', () => {
    const t = computeTransform({
      canvasWidth: 1920,
      canvasHeight: 1080,
      viewportWidth: 1920,
      viewportHeight: 1080,
      mode: 'fit',
      rotation: 0,
    });
    expect(t.scaleX).toBe(1);
    expect(t.scaleY).toBe(1);
    expect(t.translateX).toBe(0);
    expect(t.translateY).toBe(0);
  });

  it('fit añade bandas al reducir la ventana', () => {
    // Pantalla 960x540 (mitad) → escala 0.5, centrado exacto.
    const t = computeTransform({
      canvasWidth: 1920,
      canvasHeight: 1080,
      viewportWidth: 960,
      viewportHeight: 540,
      mode: 'fit',
      rotation: 0,
    });
    expect(t.scaleX).toBe(0.5);
    expect(t.translateX).toBe(0);
    expect(t.translateY).toBe(0);
  });

  it('fit con ventana más ancha centra horizontalmente', () => {
    // 2000x1080: la altura manda (1080/1080 = 1 < 2000/1920).
    const t = computeTransform({
      canvasWidth: 1920,
      canvasHeight: 1080,
      viewportWidth: 2000,
      viewportHeight: 1080,
      mode: 'fit',
      rotation: 0,
    });
    expect(t.scaleX).toBe(1);
    expect(t.translateX).toBe(40);
    expect(t.translateY).toBe(0);
  });

  it('fill cubre la ventana recortando con el factor máximo', () => {
    // 2000x1000: ancho manda → 2000/1920; sobra altura.
    const t = computeTransform({
      canvasWidth: 1920,
      canvasHeight: 1080,
      viewportWidth: 2000,
      viewportHeight: 1000,
      mode: 'fill',
      rotation: 0,
    });
    expect(t.scaleX).toBeCloseTo(2000 / 1920, 10);
    expect(t.scaleY).toBe(t.scaleX);
    expect(t.translateX).toBeCloseTo(0, 10);
    expect(t.translateY).toBeCloseTo((1000 - 1080 * (2000 / 1920)) / 2, 10);
  });

  it('stretch deforma para encajar exactamente', () => {
    const t = computeTransform({
      canvasWidth: 1920,
      canvasHeight: 1080,
      viewportWidth: 1920,
      viewportHeight: 540,
      mode: 'stretch',
      rotation: 0,
    });
    expect(t.scaleX).toBe(1);
    expect(t.scaleY).toBeCloseTo(0.5, 10);
  });

  it('rotación 90 intercambia la huella y centra (TV vertical)', () => {
    // Lienzo 1920x1080 girado 90° en ventana vertical 1080x1920 → escala 1, centrado.
    const t = computeTransform({
      canvasWidth: 1920,
      canvasHeight: 1080,
      viewportWidth: 1080,
      viewportHeight: 1920,
      mode: 'fit',
      rotation: 90,
    });
    expect(t.scaleX).toBe(1);
    expect(t.translateX).toBe((1080 + 1080 * 1) / 2);
    expect(t.translateY).toBe((1920 - 1920 * 1) / 2);
  });

  it('rotación 270 centra en el lado opuesto', () => {
    const t = computeTransform({
      canvasWidth: 1920,
      canvasHeight: 1080,
      viewportWidth: 1080,
      viewportHeight: 1920,
      mode: 'fit',
      rotation: 270,
    });
    expect(t.scaleX).toBe(1);
    expect(t.translateX).toBe(0);
    expect(t.translateY).toBe((1920 + 1920 * 1) / 2);
  });

  it('rotación 180 da la vuelta y centra', () => {
    const t = computeTransform({
      canvasWidth: 1000,
      canvasHeight: 500,
      viewportWidth: 2000,
      viewportHeight: 500,
      mode: 'fit',
      rotation: 180,
    });
    expect(t.scaleX).toBe(1);
    // El contenido rotado ocupa [tx−W, tx] × [ty−H, ty]; centrar = (v+W)/2.
    expect(t.translateX).toBe((2000 + 1000) / 2);
    expect(t.translateY).toBe((500 + 500) / 2);
  });
});

describe('transformCss', () => {
  it('compone translate + rotate + scale', () => {
    const css = transformCss({ scaleX: 0.5, scaleY: 0.5, translateX: 10, translateY: 20 }, 90);
    expect(css).toBe('translate(10px, 20px) rotate(90deg) scale(0.5, 0.5)');
  });
});
