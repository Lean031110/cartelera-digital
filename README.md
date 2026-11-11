# Cartelera Digital

[![CI](https://github.com/Lean031110/cartelera-digital/actions/workflows/ci.yml/badge.svg)](https://github.com/Lean031110/cartelera-digital/actions/workflows/ci.yml)
[![Docker](https://github.com/Lean031110/cartelera-digital/actions/workflows/docker.yml/badge.svg)](https://github.com/Lean031110/cartelera-digital/actions/workflows/docker.yml)

**CMS de cartelería digital autoalojado** para pantallas de publicidad y de restaurante.
Se instala en un servidor propio como **un único contenedor Docker** y permite diseñar,
programar y publicar contenido en varias pantallas a la vez, cada una con un diseño distinto,
sin tocar código.

> Estado: **fase F0 (esqueleto operativo)**. El monorepo, la integración continua y la
> imagen Docker multi-arquitectura funcionan de punta a punta; el editor visual, las
> pantallas y los menús llegan en las fases siguientes. Consulta
> [docs/PROGRESS.md](docs/PROGRESS.md).

## Qué será (v1.0)

- **Editor visual**: arrastra widgets (hora, logo, vídeo, carta, texto…) sobre un lienzo,
  guárdalo como diseño con tema de colores y tipografías, y asígnalo a una pantalla.
- **Publicidad y restaurante**: rotación de anuncios, cartas con precios y «agotado»,
  menú del día, programación horaria.
- **5 o más pantallas simultáneas** con diseños diferentes, actualizadas en segundos.
- **Reproductor web** que funciona en cualquier navegador: TV con navegador, mini-PC,
  Raspberry Pi, Android TV box y pantallas profesionales Samsung/LG con carga de URL.
- **Resiliente**: si falla la red, la pantalla sigue con lo último válido; jamás se queda
  en blanco.
- **Un contenedor, un volumen**: instalación y copia de seguridad triviales.

## Instalación rápida (esqueleto F0)

Requisitos: un servidor con Docker y Docker Compose.

```bash
mkdir cartelera && cd cartelera
curl -O https://raw.githubusercontent.com/Lean031110/cartelera-digital/main/docker/compose.example.yml
docker compose -f compose.example.yml up -d
```

- Panel de administración: `http://IP-DEL-SERVIDOR:8080/admin`
- Reproductor (pantalla en espera): `http://IP-DEL-SERVIDOR:8080/tv`
- Sonda de estado: `http://IP-DEL-SERVIDOR:8080/healthz`

La base de datos y los medios viven en el volumen `cartelera-data`. El contenedor corre
como usuario no privilegiado y publica imagen para `amd64` y `arm64` en
`ghcr.io/lean031110/cartelera-digital`.

## Desarrollo

Requisitos: Node.js 24 (o 26) y pnpm 12 (fijado en `package.json#packageManager`).

```bash
corepack enable
pnpm install
pnpm verify      # lint + format + typecheck + build + test
pnpm e2e         # pruebas Playwright (requiere build previo)
```

### Estructura del monorepo

```
apps/
  server/        Fastify: API /api/v1, estáticos /admin y /tv, healthz (§6.2)
  admin/         SPA React + Vite + Tailwind, servida en /admin
  player/        Reproductor web en ES5 (Chromium 53+), servido en /tv
packages/
  shared/        Esquemas zod del diseño/manifiesto y resolveSchedule (§7)
  render-core/   Motor de render: escalado/rotación (DEC-09) y montaje DOM (DEC-08)
  widgets/       Registro de widgets: esquema de props, etiqueta e icono
e2e/             Pruebas Playwright del esqueleto
docker/          Dockerfile, entrypoint y compose de ejemplo
docs/            spec, ADRs, runbooks y PROGRESS.md
```

### Convenciones

- **Idioma**: interfaz y documentación de usuario en español; código, commits, issues y PR
  en inglés. Los textos de la interfaz siempre vía i18n.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`,
  `chore:`…); versionado SemVer automatizado con release-please.
- **Rama `main` protegida**: todo cambio pasa por PR con CI verde.
- **Dependencias**: licencias permisivas únicamente (MIT/BSD/Apache/ISC); GPL/AGPL/SSPL
  prohibidas y verificadas en CI (`THIRD_PARTY_NOTICES.md`).
- El reproductor debe compilar a **ES5** sin CSS Grid, sin `gap` en flexbox, sin `Intl`
  con zona horaria (§5.3); el bundle se mantiene por debajo de 150 KB gzip.

## Documentación

- [Guía maestra de diseño (spec)](docs/spec/) — fuente de verdad del proyecto
- [Registro de decisiones (ADR)](docs/adr/)
- [Progreso por fases](docs/PROGRESS.md)
- [Runbook de instalación](docs/runbooks/instalacion.md)

## Licencia

[MIT](LICENSE) © 2026 Lean031110. Proyecto de uso personal y gratuito para la comunidad.
