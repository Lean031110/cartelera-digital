import { expect, test } from '@playwright/test';

test('healthz responde ok', async ({ request }) => {
  const res = await request.get('/healthz');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe('ok');
  expect(body.service).toBe('cartelera');
});

test('la raíz redirige al panel', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/admin\/?$/);
});

test('el panel de administración carga con su título', async ({ page }) => {
  await page.goto('/admin/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Panel de administración' }),
  ).toBeVisible();
  await expect(page.getByText('F0 — Esqueleto operativo', { exact: true })).toBeVisible();
});

test('el reproductor muestra la pantalla en espera con reloj', async ({ page }) => {
  await page.goto('/tv/');
  await expect(page.getByRole('heading', { name: 'Pantalla en espera' })).toBeVisible();
  const clock = page.locator('[data-testid="clock"]');
  await expect(clock).toBeVisible();
  await expect(clock).toHaveText(/^\d{2}:\d{2}$/);
  // El escenario de 1920x1080 se escala al tamaño de la ventana (DEC-09).
  const transform = await clock.evaluate((_el) => {
    const stage = document.getElementById('cb-stage');
    return stage !== null ? stage.style.transform : '';
  });
  expect(transform).toContain('scale(');
});
