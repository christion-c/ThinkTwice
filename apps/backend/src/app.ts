import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";

import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { vehicleRouter } from "./modules/vehicles/vehicle.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    cors({
      origin:
        env.CORS_ORIGIN === "*"
          ? true
          : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_request, response) => {
    response.status(200).json({
      name: "ThinkTwice API",
      version: "0.1.0",
    });
  });

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/vehicles", vehicleRouter);

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