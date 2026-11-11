# PROGRESS.md — Estado del proyecto

Registro vivo del estado por tarea, supuestos asumidos y bloqueos (guía §3.6, §3.2.12).
Idioma: español. Última actualización: 2026-11-12 (F0).

## Fase actual: F0 — Fundaciones y esqueleto andante

| #     | Tarea                                                                                    | Estado   | Notas                                                      |
| ----- | ---------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| F0.1  | Investigar versiones vigentes (npm/actions/base image)                                   | ✅ Hecho | Registro del 2026-11-12; TS fijado a 5.9.3 (ADR-0001)      |
| F0.2  | Monorepo pnpm + tooling (tsconfig, eslint, prettier, vitest)                             | ✅ Hecho | pnpm 12.18.0 fijado con hash; TS estricto                  |
| F0.3  | `packages/shared`: esquemas §7.2/§7.4, resolveSchedule §7.3, marcadores                  | ✅ Hecho | Cobertura ≥80 % líneas; tabla de casos de programación     |
| F0.4  | `packages/render-core`: computeTransform (fit/fill/stretch × 4 rotaciones) y montaje DOM | ✅ Hecho | Sin innerHTML; placeholders de widgets hasta F2/F3         |
| F0.5  | `apps/server`: Fastify + /healthz + /readyz + /api/v1/ping + estáticos /admin /tv        | ✅ Hecho | Cobertura ≥70 % líneas                                     |
| F0.6  | `apps/admin`: React+Vite+Tailwind+i18n (es)                                              | ✅ Hecho | Pantalla de estado de fase                                 |
| F0.7  | `apps/player`: ES5, pantalla en espera, es-check, presupuesto 150 KB gzip                | ✅ Hecho | Rollup IIFE; sin CSS Grid/gap/inset                        |
| F0.8  | `packages/widgets` + `e2e` Playwright                                                    | ✅ Hecho | 5 widgets integrados; smoke de /admin /tv /healthz         |
| F0.9  | Docker multi-arch no-root + healthcheck + compose ejemplo                                | ✅ Hecho | node:24-slim por digest; pnpm deploy --prod                |
| F0.10 | CI/CD: ci.yml, docker.yml, release-please, dependabot, plantillas                        | ✅ Hecho | Acciones fijadas por SHA; verificación de imagen publicada |
| F0.11 | Docs: README, AGENTS.md, spec, ADR 0001/0002, runbook, PROGRESS                          | ✅ Hecho | —                                                          |
| F0.12 | Licencias: MIT + THIRD_PARTY_NOTICES + control en CI                                     | ✅ Hecho | Permitidas MIT/ISC/BSD/Apache; GPL/AGPL/SSPL prohibidas    |
| F0.13 | Publicación: repo público, main protegida, imagen edge en GHCR                           | ✅ Hecho | Ver informe F0                                             |

## Criterios de éxito (§1.6) — situación

| Criterio                          | Estado                          |
| --------------------------------- | ------------------------------- |
| S6 CI verde en cada fusión a main | ✅ Vigente desde F0             |
| S1–S5                             | Pendientes de sus fases (F2–F6) |

## Supuestos y valores por defecto (Anexo D no disponible)

| #   | Supuesto                                                                                            | Motivo                                                         |
| --- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| A1  | Plan de fases reconstruido (ADR-0002)                                                               | §15 truncada                                                   |
| A2  | F0 = esqueleto andante completo + CI + Docker + docs                                                | Inferido de §3.6, §6.2, DEC-18/19                              |
| A3  | Bootstrap inicial directo a `main`; PR desde F1                                                     | Práctica estándar; ADR-0001.7                                  |
| A4  | El player no consume aún `render-core`/`shared` (bundle tsc+rollup sin plugin de resolución)        | Se integra en F2 con el pipeline babel+core-js completo (§5.3) |
| A5  | `eslint-plugin-compat` aún no activo en el player                                                   | Se activa cuando el player tenga superficie real de API (F2)   |
| A6  | El texto del admin usa grid de Tailwind (permitido: la regla anti-Grid es solo para el player §5.3) | —                                                              |
| A7  | TS 5.9.3 (no TS 7)                                                                                  | typescript-eslint no soporta tsgo (ADR-0001.5)                 |

## Bloqueos

Ninguno.

## Comandos útiles

```bash
pnpm verify                 # lint + format + typecheck + build + test (todo el workspace)
pnpm e2e                    # Playwright contra el server real (puerto 8090)
pnpm licenses:update        # tras cambiar dependencias (CI exige el fichero al día)
pnpm --filter @cartelera/server test      # solo server
node apps/server/dist/main.js             # arrancar el server a mano
```

## Comandos GitHub (sin `gh`, usando la API)

```bash
TOKEN=$(cat /home/z/my-project/.ghtoken)
curl -s -H "Authorization: Bearer $TOKEN" https://api.github.com/repos/Lean031110/cartelera-digital/actions/runs?per_page=5
curl -s -H "Authorization: Bearer $TOKEN" https://api.github.com/repos/Lean031110/cartelera-digital/actions/runs/<id>/jobs
```

## Próxima fase (pendiente de confirmación del humano)

F1 — Núcleo del servidor: SQLite + Drizzle + migraciones, usuarios/roles/sesiones
(argon2id, cookie httpOnly), asistente de primer uso, auditoría. Plan completo en
ADR-0002.
