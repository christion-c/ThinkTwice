import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { budgetRouter } from "./modules/budget/budget.routes.js";
import { fillUpHistoryRouter } from "./modules/fill-up-history/fill-up-history.routes.js";
import { financeRouter } from "./modules/finance/finance.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { predictionsRouter } from "./modules/predictions/predictions.routes.js";
import { vehicleRouter } from "./modules/vehicles/vehicle.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  // API-only service: no browser-rendered HTML, so helmet's default
  // Content-Security-Policy would just add noise without protecting anything.
  app.use(helmet({ contentSecurityPolicy: false }));

  app.use(
    cors({
      origin:
        env.CORS_ORIGIN === "*"
          ? true
          : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  // General ceiling for all routes.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Auth endpoints are more sensitive to abuse (credential stuffing,
  // token-verification hammering), so they get a tighter budget.
  const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get("/", (_request, response) => {
    response.status(200).json({
      name: "ThinkTwice API",
      version: "0.1.0",
    });
  });

  app.use("/health", healthRouter);
  app.use("/auth", authRateLimiter, authRouter);
  app.use("/vehicles", vehicleRouter);
  app.use("/budget-entries", budgetRouter);
  app.use("/predictions", predictionsRouter);
  app.use("/finance", financeRouter);
  app.use("/fill-up-history", fillUpHistoryRouter);

  const notFoundHandler: RequestHandler = (_request, response) => {
    response.status(404).json({
      error: "Route not found",
    });
  };

  app.use(notFoundHandler);

  const errorHandler: ErrorRequestHandler = (
    error,
    _request,
    response,
    _next,
  ) => {
    console.error(error);

    response.status(500).json({
      error: "Internal server error",
    });
  };

  app.use(errorHandler);

  return app;
}
