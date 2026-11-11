import { describe, expect, it } from 'vitest';
import { resolveMarkers } from '../src/index.js';

describe('resolveMarkers', () => {
  const theme = { bg: '#0b0f19', text: '#f2f5fa' };
  const vars = { menu_dia: 'Cocido madrileño', aforo: 42, abierto: true };

  it('resuelve marcadores de tema y de variable en un mismo texto', () => {
    const { value, missing } = resolveMarkers('Fondo {theme.bg}, menú {var.menu_dia}', theme, vars);
    expect(value).toBe('Fondo #0b0f19, menú Cocido madrileño');
    expect(missing).toEqual([]);
  });

  it('convierte números y booleanos a texto', () => {
    const { value } = resolveMarkers('Aforo: {var.aforo} — Abierto: {var.abierto}', theme, vars);
    expect(value).toBe('Aforo: 42 — Abierto: true');
  });

  it('devuelve vacío y registra los marcadores que faltan', () => {
    const { value, missing } = resolveMarkers('{theme.bg} {var.desconocida}', theme, {});
    expect(value).toBe('#0b0f19 ');
    expect(missing).toEqual(['var.desconocida']);
  });

  it('acumula faltantes de ambos espacios de nombres', () => {
    const { missing } = resolveMarkers('{theme.inexistente} y {var.tampoco}', theme, vars);
    expect(missing).toEqual(['theme.inexistente', 'var.tampoco']);
  });

  it('deja intacto un texto sin marcadores', () => {
    const { value, missing } = resolveMarkers('Sin marcadores', theme, vars);
    expect(value).toBe('Sin marcadores');
    expect(missing).toEqual([]);
  });
});
