# syntax=docker/dockerfile:1
# Cartelera — un solo contenedor (DEC-01), multi-arquitectura amd64/arm64,
# usuario no root con healthcheck, publicada en GHCR (DEC-17/DEC-18).

ARG NODE_IMAGE=node:24-slim@sha256:0998f9a7af5bba96fb32e2aeafde650a625012cb194a57e7f3939bf3e592721f

# ---- build stage ------------------------------------------------------------
FROM ${NODE_IMAGE} AS build
WORKDIR /repo

# corepack instala el pnpm fijado (versión+hash) en package.json#packageManager
RUN corepack enable

# Dependencias primero (caché de capas): solo manifiestos de paquetes.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/server/package.json apps/server/
COPY apps/admin/package.json apps/admin/
COPY apps/player/package.json apps/player/
COPY packages/shared/package.json packages/shared/
COPY packages/render-core/package.json packages/render-core/
COPY packages/widgets/package.json packages/widgets/
COPY e2e/package.json e2e/
RUN pnpm install --frozen-lockfile

# Compilar todo y crear el despliegue de producción aislado del servidor.
COPY . .
RUN pnpm -r --if-present build \
  && pnpm --filter @cartelera/server deploy --prod /stage

# ---- runtime stage ----------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    DATA_DIR=/data \
    ADMIN_DIST=/app/public/admin \
    PLAYER_DIST=/app/public/tv

WORKDIR /app
RUN mkdir -p /data /app/public && chown -R node:node /data /app

COPY --from=build --chown=node:node /stage/node_modules ./node_modules
COPY --from=build --chown=node:node /stage/package.json ./package.json
COPY --from=build --chown=node:node /stage/dist ./dist
COPY --from=build --chown=node:node /repo/apps/admin/dist ./public/admin
COPY --from=build --chown=node:node /repo/apps/player/dist ./public/tv
COPY --chown=node:node docker/entrypoint.sh /usr/local/bin/cartelera-entrypoint

USER node
EXPOSE 8080
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/healthz').then(function(r){process.exit(r.ok?0:1)}).catch(function(){process.exit(1)})"

ENTRYPOINT ["cartelera-entrypoint"]
CMD ["node", "dist/main.js"]
