# AGENTS.md — Cartelera Digital

Instrucciones para agentes de IA (y personas) que trabajan en este repositorio.
Fuente de verdad: `docs/spec/`. Máximo 150 líneas.

## Reglas de oro (resumen de §3.2 de la guía)

1. Lee `docs/spec/` y `docs/PROGRESS.md` antes de actuar. Para cambiar decisiones: ADR en `docs/adr/`.
2. Trabaja por fases. No empieces una fase sin confirmación explícita del humano.
3. «Terminado» = verde en GitHub Actions, no «funciona en mi máquina».
4. Ramas cortas `feat/f<n>-<tarea>-<slug>`, PR pequeños (< 400 líneas netas), commits convencionales.
5. Tras cada push, vigila las Actions y corrige hasta verde (máx. 3 intentos por causa raíz; luego escala).
6. Prohibido: desactivar pruebas/linters, `--no-verify`, `continue-on-error`, rebajar cobertura.
7. Sin secretos en el repo. Acciones de GitHub fijadas por SHA completo con comentario de versión.
8. Verifica versiones vigentes en la fuente oficial antes de añadir dependencias o acciones.
9. Ante ambigüedad: aplica el valor por defecto de la guía, regístralo en `docs/PROGRESS.md` y sigue.
10. Documenta mientras construyes. Interfaz y docs de usuario en español; código/commits/PR en inglés.
11. Mantén `docs/PROGRESS.md` al día al final de cada tarea.

## Comandos

```bash
corepack enable && pnpm install   # pnpm 12 fijado en package.json#packageManager
pnpm verify                       # lint + format:check + typecheck + build + test
pnpm e2e                          # Playwright (requiere build previo)
pnpm licenses:update              # regenerar THIRD_PARTY_NOTICES.md tras cambiar dependencias
node apps/server/dist/main.js     # arrancar el servidor (requiere build previo)
```

- Server local: `node apps/server/dist/main.js` (env: `PORT`, `HOST`, `DATA_DIR`, `LOG_LEVEL`,
  `ADMIN_DIST`, `PLAYER_DIST`).
- E2E arranca el server real en el puerto 8090 con `DATA_DIR` temporal.

## Estructura

```
apps/server     Fastify: /api/v1, /admin, /tv, /healthz, /readyz
apps/admin      SPA React+Vite+Tailwind (base /admin/)
apps/player     Reproductor ES5 sin framework (servido en /tv, bundle ≤150 KB gzip)
packages/shared Esquemas zod (layout §7.2, manifiesto §7.4) + resolveSchedule (§7.3) + marcadores
packages/render-core  Escalado/rotación (DEC-09) + montaje DOM (DEC-08); sin innerHTML
packages/widgets      Registro de widgets (esquema props + etiqueta es + icono)
e2e             Playwright smoke
docker/         Dockerfile multi-arch no-root, entrypoint.sh, compose.example.yml
docs/           spec/, adr/, runbooks/, PROGRESS.md
```

## Convenciones de código

- TypeScript estricto en todas las paquetes; `import type` para tipos (verbatimModuleSyntax).
- IDs ULID en texto; fechas epoch ms UTC enteros.
- El texto rico se guarda como estructura (paragraphs/runs), nunca HTML crudo.
- `packages/shared` y `render-core` no pueden usar `Intl` con zona horaria ni APIs modernas
  (deben poder transpilarse a ES5 para el player, §5.3).
- Player: sin CSS Grid, sin `gap` de flexbox, sin `inset`/`aspect-ratio`/`ResizeObserver`;
  posicionamiento absoluto en px de diseño.
- Pruebas: Vitest unit + Playwright e2e. Cobertura: 80 % líneas en `shared`/`render-core`,
  70 % en `server` (§6.6). No rebajar umbrales.
- Seguridad: validación zod en todo endpoint; sin `innerHTML` con contenido.

## Flujo de trabajo por tarea (§3.3)

1. Lee la tarea y sus criterios de aceptación. 2. Crea rama `feat/f<fase>-<tarea>-<slug>`.
2. Pruebas primero cuando sea viable. 4. Implementa. 5. Local: `pnpm verify`.
3. Commit convencional. 7. Push + PR con plantilla. 8. Vigila Actions hasta verde.
4. Autorrevisa el diff (¿pruebas? ¿docs? ¿i18n? ¿secretos?). 10. Squash-merge.
5. Actualiza `docs/PROGRESS.md`.

## Estado actual

Fase **F0** completada (esqueleto operativo). El plan por fases reconstruido vive en
`docs/adr/0002-plan-de-fases-reconstruido.md` (pendiente reconciliar con §15 de la guía
cuando esté disponible el documento completo). Ver `docs/PROGRESS.md`.
