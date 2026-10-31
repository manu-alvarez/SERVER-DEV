# ─────────────────────────────────────────────────────────────────────────────
# UIEP backend — Fase 0 (ETAPA 4): backend real sobre @uiep/design-engine
#
# Se construye desde el monorepo apps/uiep (compose: context .., dockerfile
# backend/Dockerfile) porque el backend compila @uiep/design-engine y
# @uiep/entity-schema como dependencias workspace:*.
#
# Reproducible: pnpm 9.15.0 vía corepack (campo packageManager del workspace),
# instalación --frozen-lockfile, compilación limpia del subgrafo del backend
# (`--filter "uiep-backend..."` = backend + sus dependencias de workspace).
# No se despliega por sí solo: el Cmd arranca dist/server.js (Express + runPipeline).
# ─────────────────────────────────────────────────────────────────────────────
# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# 1) Compilación — el contexto llega SIN dist/ ni node_modules (.dockerignore)
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "uiep-backend..." build

# 2) Empaquetado — node_modules de producción del backend (con deps de workspace)
FROM base AS deploy-stage
COPY --from=build /app /app
RUN pnpm --filter uiep-backend deploy --prod /deploy

# 3) Runtime mínimo — artefacto compilado + dependencias podadas
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deploy-stage /deploy ./
# Fase 9: plantillas (blueprints) que el backend sirve instalables
COPY --from=build /app/backend/templates /app/templates
EXPOSE 4000
CMD ["node", "dist/server.js"]
