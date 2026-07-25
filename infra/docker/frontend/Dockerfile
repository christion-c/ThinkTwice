# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS development

WORKDIR /workspace

ENV NODE_ENV=development \
    npm_config_fund=false \
    npm_config_update_notifier=false

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY --chown=node:node . .

RUN chown -R node:node /workspace

USER node

EXPOSE 8081

CMD ["npx", "expo", "start", "--lan", "--port", "8081"]