import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { App } from '../src/App';
import { initI18n } from '../src/i18n';

describe('App', () => {
  beforeAll(async () => {
    await initI18n();
  });

  afterEach(() => {
    cleanup();
  });

  it('muestra el título del panel', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Panel de administración' })).toBeTruthy();
  });

  it('enlaza al reproductor y al estado técnico', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Abrir reproductor (/tv)' }).getAttribute('href')).toBe(
      '/tv/',
    );
    expect(screen.getByRole('link', { name: 'Estado técnico (/healthz)' })).toBeTruthy();
  });

  it('muestra la fase actual y el protocolo del reproductor', () => {
    render(<App />);
    expect(screen.getByText('F0 — Esqueleto operativo')).toBeTruthy();
    expect(screen.getByText('v1')).toBeTruthy();
  });
});
