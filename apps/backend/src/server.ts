import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { database } from "./db/pool.js";

const app = createApp();

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(
    `ThinkTwice backend listening on http://0.0.0.0:${env.PORT}`,
  );
});

let isShuttingDown = false;

async function shutDown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`Received ${signal}. Shutting down cleanly.`);

  const forcedShutdownTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10_000);

  forcedShutdownTimer.unref();

  server.close(async (serverError) => {
    try {
      await database.end();

      if (serverError) {
        console.error("HTTP server shutdown failed:", serverError);
        process.exit(1);
      }

      console.log("Shutdown complete.");
      process.exit(0);
    } catch (databaseError) {
      console.error("Database shutdown failed:", databaseError);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => {
  void shutDown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutDown("SIGTERM");
});