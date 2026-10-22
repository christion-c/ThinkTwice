import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyServerOptions } from "fastify";
import type { JWTVerifyGetKey } from "jose";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { createFirebaseTokenVerifier } from "./auth/firebase-token.ts";
import type { Config } from "./config/env.ts";
import { categoryRoutes } from "./modules/categories/routes.ts";
import { expenseRoutes } from "./modules/expenses/routes.ts";
import { healthRoutes } from "./modules/health/routes.ts";
import { userRoutes } from "./modules/users/routes.ts";
import { registerAuth } from "./plugins/auth.ts";
import { registerDatabase } from "./plugins/database.ts";
import { registerErrorHandlers } from "./plugins/error-handler.ts";

/** Largest request body accepted: 100 KB, far more than any v1 request needs. */
const BODY_LIMIT_BYTES = 100 * 1024;

const REDACTED_LOG_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
];

/** Builds logger settings: readable output in development, JSON elsewhere, credentials always redacted. */
function buildLoggerOptions(
  config: Config,
): NonNullable<FastifyServerOptions["logger"]> {
  if (config.nodeEnv === "development") {
    return {
      level: config.logLevel,
      redact: REDACTED_LOG_PATHS,
      transport: { target: "pino-pretty" },
    };
  }
  return { level: config.logLevel, redact: REDACTED_LOG_PATHS };
}

export interface AppOptions {
  /** Keys that sign Firebase ID tokens. Defaults to Google's public keys; tests pass their own. */
  firebaseSigningKeys?: JWTVerifyGetKey;
}

/** Creates the Fastify app with security plugins, error handling and all routes (used by the server and tests). */
export async function buildApp(config: Config, options: AppOptions = {}) {
  const app = Fastify({
    logger: buildLoggerOptions(config),
    bodyLimit: BODY_LIMIT_BYTES,
    trustProxy: config.trustProxy,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet);
  await app.register(cors, { origin: config.corsOrigins });
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: "1 minute",
  });
  registerErrorHandlers(app);
  registerDatabase(app, config.databaseUrl);
  registerAuth(
    app,
    createFirebaseTokenVerifier(
      config.firebaseProjectId,
      options.firebaseSigningKeys,
    ),
  );

  await app.register(healthRoutes);
  await app.register(userRoutes);
  await app.register(categoryRoutes);
  await app.register(expenseRoutes);

  return app;
}

export type App = Awaited<ReturnType<typeof buildApp>>;
