# ADR-0002: Plan de fases reconstruido (provisional)

- **Estado**: aceptado (provisional, a reconciliar con §15 de la guía)
- **Fecha**: 2026-11-12
- **Decidido por**: IA constructora, pendiente de confirmación del humano en cada punto de control

## Contexto

El documento maestro recibido está truncado en §7.4: falta el **plan por fases F0–F6**
(§15) con sus tareas y criterios de aceptación, así como los anexos A–D. Para poder
avanzar de forma ordenada y verificable se reconstruye un plan compatible con las
decisiones DEC-01…DEC-20, los módulos M0–M12 citados a lo largo del texto y los
criterios de éxito S1–S6 (§1.6).

## Plan reconstruido

| Fase   | Nombre                          | Contenido esencial                                                                                                                                      | Criterio de salida                                  |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **F0** | Fundaciones y esqueleto andante | Monorepo pnpm, tooling, CI Actions, Docker multi-arch, docs, server/admin/player funcionando                                                            | CI verde; imagen `edge` en GHCR; informe F0         |
| **F1** | Núcleo del servidor             | SQLite (WAL) + Drizzle + migraciones; usuarios/roles y sesiones (argon2id, cookie httpOnly); asistente de primer arranque; auditoría                    | API auth completa en verde; login e2e               |
| **F2** | Contenido y manifiesto          | Medios (hash SHA-256, ffmpeg/sharp), menús de restaurante, temas, playlists, manifiesto + ETag, WebSocket `manifest.changed`, player consume manifiesto | Publicar un diseño llega a la pantalla en <3 s (S2) |
| **F3** | Editor visual                   | render-core completo con widgets, editor DOM (react-moveable), vista previa, plantillas, deshacer/rehacer                                               | Persona no técnica crea diseño de 5 elementos (S4)  |
| **F4** | Pantallas y programación        | Vinculación (enlace + PIN, código), `resolveSchedule` en producción, overrides, grupos, monitoreo de latidos                                            | 5 pantallas, 5 diseños, rotación y escalado reales  |
| **F5** | Robustez y resistencia          | Modo sin conexión del player (localStorage/IndexedDB), retroceso exponencial, reintentos, métricas de presupuesto (S5), copias de seguridad             | E2E de caída de red/servidor/navegador (S3)         |
| **F6** | Endurecimiento y v1.0           | Seguridad (§11 disponible), rendimiento, usabilidad, runbooks completos, export/import, release v1.0.0                                                  | Instalación limpia en <10 min sin código (S1)       |

## Reglas

1. Cada fase termina con un **punto de control** (informe según plantilla del Anexo B
   cuando esté disponible, enlaces a ejecuciones verdes, guion de demostración, riesgos)
   y parada hasta confirmación escrita del humano (§3.5).
2. Ninguna tarea de una fase posterior empieza antes de cerrar la anterior (§3.2.2).
3. Las piezas ya construidas en F0 que pertenezcan nominalmente a fases posteriores
   (p. ej. `resolveSchedule`, `render-core` básico) se **completan**, no se rehacen: F0
   las sembró como esqueleto.
4. Cuando llegue el documento completo, este ADR se sustituye por el plan real y se
   registran las diferencias.

## Supuestos registrados

- La numeración y el contenido exacto de F1–F6 del documento original pueden diferir; la
  reconstrucción prioriza los criterios medibles S1–S6.
- F7+ (reproductores nativos, LED, DEC-20) queda fuera del alcance de la 1.0, como en la
  guía.
