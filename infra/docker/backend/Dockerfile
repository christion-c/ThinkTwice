# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22

# ---------------------------------------------------------
# Dependencies
# ---------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS dependencies

WORKDIR /workspace

ENV npm_config_fund=false \
    npm_config_update_notifier=false

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ---------------------------------------------------------
# Development
# ---------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS development

WORKDIR /workspace

ENV NODE_ENV=development \
    npm_config_fund=false \
    npm_config_update_notifier=false

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --chown=node:node . .

RUN chown -R node:node /workspace

USER node

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ---------------------------------------------------------
# Build
# ---------------------------------------------------------
FROM dependencies AS build

COPY . .

RUN npm run build \
    && npm prune --omit=dev

# ---------------------------------------------------------
# Production
# ---------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build --chown=node:node /workspace/package.json ./
COPY --from=build --chown=node:node /workspace/package-lock.json ./
COPY --from=build --chown=node:node /workspace/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/dist ./dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]