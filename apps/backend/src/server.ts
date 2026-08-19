import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { migrations } from "./db/migrations/index.js";
import { runMigrations } from "./db/migrations/migration-runner.js";
import { database } from "./db/pool.js";

// Starts the ThinkTwice backend. Migrations run before the HTTP server
// starts, so the API never accepts requests while its required
// database tables are unavailable.
async function startServer(): Promise<void> {
  try {
    // Bring the schema up to date before accepting any traffic.
    await runMigrations(migrations);

    const app = createApp();

    // Bind to 0.0.0.0 (not just localhost) so it's reachable from
    // outside the container in Docker/Cloud Run.
    const server = app.listen(env.PORT, "0.0.0.0", () => {
      console.log(
        `ThinkTwice backend listening on http://0.0.0.0:${env.PORT}`,
      );
    });

    // Guards against handling SIGINT/SIGTERM twice if both arrive close together.
    let isShuttingDown = false;

    // Stops accepting new requests and closes the PostgreSQL pool.
    async function shutDown(signal: string): Promise<void> {
      if (isShuttingDown) {
        return;
      }

      isShuttingDown = true;

      console.log(`Received ${signal}. Shutting down cleanly.`);

      // Belt-and-suspenders: force-exit if graceful shutdown hangs.
      const forcedShutdownTimer = setTimeout(() => {
        console.error("Graceful shutdown timed out.");
        process.exit(1);
      }, 10_000);

      // This timer should not keep Node running by itself.
      forcedShutdownTimer.unref();

      // Stop accepting new connections, then close the database pool.
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

    // Docker/Cloud Run send SIGTERM on shutdown; SIGINT covers Ctrl+C locally.
    process.on("SIGINT", () => {
      void shutDown("SIGINT");
    });

    process.on("SIGTERM", () => {
      void shutDown("SIGTERM");
    });
  } catch (startupError) {
    // A migration failure leaves the database transaction rolled back -
    // the API must not start against an incomplete schema.
    console.error("ThinkTwice backend failed to start:", startupError);

    try {
      await database.end();
    } catch (databaseError) {
      console.error(
        "Failed to close the database after startup failure:",
        databaseError,
      );
    }

    process.exit(1);
  }
}

void startServer();
