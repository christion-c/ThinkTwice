import { buildApp } from "./app.ts";
import { loadConfig } from "./config/env.ts";

/** Starts the API server and closes it cleanly when the process is asked to stop. */
async function start(): Promise<void> {
  const config = loadConfig();
  const app = await buildApp(config);

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      app.log.info({ signal }, "Shutting down");
      app.close().catch((error: unknown) => {
        app.log.error({ err: error }, "Error while shutting down");
        process.exitCode = 1;
      });
    });
  }

  await app.listen({ host: config.host, port: config.port });
}

await start();
