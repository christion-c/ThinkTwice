# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-bookworm-slim AS development

WORKDIR /workspace

ENV NODE_ENV=development \
    npm_config_fund=false \
    npm_config_update_notifier=false

RUN chown node:node /workspace
USER node

COPY --chown=node:node package.json package-lock.json ./

RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci

COPY --chown=node:node . .

EXPOSE 8081

CMD ["npx", "expo", "start", "--lan", "--port", "8081"]