# syntax=docker/dockerfile:1.7
#
# Build context is the repo root (not apps/backend) so that packages/
# shared-types — a type-only package apps/backend imports via a tsconfig
# path alias — is available to `npm run build`'s tsc invocation. Nothing
# under packages/ ships in the production image: shared-types has no
# runtime code, so `import type` erases it entirely at compile time.

ARG NODE_VERSION=22

# ---------------------------------------------------------
# Dependencies
# ---------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS dependencies

WORKDIR /workspace

ENV npm_config_fund=false \
    npm_config_update_notifier=false

COPY apps/backend/package.json apps/backend/package-lock.json ./apps/backend/

RUN --mount=type=cache,target=/root/.npm \
    npm --prefix apps/backend ci

# ---------------------------------------------------------
# Development
# ---------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS development

WORKDIR /workspace/apps/backend

RUN mkdir -p /workspace/packages && chown -R node:node /workspace

ENV NODE_ENV=development \
    npm_config_fund=false \
    npm_config_update_notifier=false

COPY --from=dependencies --chown=node:node /workspace/apps/backend/node_modules ./node_modules
COPY --chown=node:node apps/backend/. .
COPY --chown=node:node packages/ /workspace/packages/

USER node

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ---------------------------------------------------------
# Build
# ---------------------------------------------------------
FROM dependencies AS build

COPY apps/backend/. /workspace/apps/backend/
COPY packages/ /workspace/packages/

RUN npm --prefix apps/backend run build \
    && npm --prefix apps/backend prune --omit=dev

# ---------------------------------------------------------
# Production
# ---------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build --chown=node:node /workspace/apps/backend/package.json ./
COPY --from=build --chown=node:node /workspace/apps/backend/package-lock.json ./
COPY --from=build --chown=node:node /workspace/apps/backend/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/apps/backend/dist ./dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
