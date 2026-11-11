# ADR-0001: Configuración inicial del repositorio y registro de decisiones

- **Estado**: aceptado
- **Fecha**: 2026-11-12
- **Decidido por**: el propietario (humano), con la IA constructora

## Contexto

Arranca la fase F0. La guía maestra (v1.0, docs/spec/) fija las decisiones DEC-01…DEC-20
pero deja varias cuestiones de configuración del repositorio en manos del humano, y el
documento recibido está truncado en §7.4 (faltan §8–17 y los anexos A–D).

## Decisiones

1. **Repositorio**: `Lean031110/cartelera-digital` en GitHub, **público**. El nombre
   «Cartelera» era provisional (guía §1.1); «cartelera-digital» es más descriptivo. La
   imagen resultante es `ghcr.io/lean031110/cartelera-digital`.
2. **Licencia**: **MIT** (DEC-16 resuelta). El propietario declara el proyecto de uso
   personal y gratuito para la comunidad, sin propósito comercial propio. Nota: MIT no
   prohíbe usos comerciales por terceros; si algún día se desea impedirlo, hará falta un
   ADR que cambie la licencia.
3. **Ritmo de trabajo**: fiel a la guía — informe de punto de control al cerrar cada fase
   y parada hasta confirmación escrita del humano (§3.5).
4. **Registro de decisiones**: el registro DEC-01…DEC-20 vive en la guía; este directorio
   (`docs/adr/NNNN-*.md`) recoge decisiones nuevas o cambios sobre ella, con numeración
   independiente.
5. **TypeScript 5.9.3** en lugar del último mayor (TS 7.0.2): `typescript-eslint` 8.72
   declara compatibilidad `>=4.8.4 <6.1.0` y no soporta el port nativo tsgo. Se reevaluará
   cuando typescript-eslint soporte TS 7.
6. **Versiones verificadas el 2026-11-12** en los registros oficiales (npm, GitHub
   Releases, Docker Hub), conforme a la regla 8 de §3.2: pnpm 12.18.0, Node 24 LTS
   (CI además en 26), Fastify 5.12.8, React 19.3.1, Vite 8.3.8, Vitest 5.1.0, ESLint
   10.14.0, zod 4.6.7, Playwright 1.65.0, Tailwind 4.3.5. Acciones de GitHub fijadas por
   SHA (checkout v7.0.1, setup-node v7.1.0, pnpm/action-setup v6.1.1, docker/* v4/v6/v7,
   release-please v5.0.0). Imagen base `node:24-slim` fijada por digest.
7. **Alcance de F0** (inferido de §1–7 al faltar §15): monorepo operativo completo,
   esqueleto andante («walking skeleton») con server + admin + player funcionando de
   punta a punta, CI verde, imagen multi-arquitectura publicada en GHCR, docs y
   protección de rama. El bootstrap inicial se sube directamente a `main` (commit
   «chore: bootstrap»); a partir de F1 todo va por PR.

## Consecuencias

- La imagen se puede descargar sin credenciales (repositorio y paquete públicos), lo que
  mantiene el flujo de instalación de §1.2.
- Las dependencias quedan fijadas por versión exacta + lockfile; Dependabot propone
  actualizaciones semanales agrupadas por tipo.
- Todo lo no cubierto por el documento disponible se registra como supuesto en
  `docs/PROGRESS.md` hasta la reconciliación con la guía completa.
