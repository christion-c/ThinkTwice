import type { FastifyInstance } from "fastify";

import { createDatabase, type Database } from "../db/client.ts";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}

/** Connects the app to PostgreSQL as app.db and closes the connections when the app closes. */
export function registerDatabase(
  app: FastifyInstance,
  databaseUrl: string,
): void {
  const { db, pool } = createDatabase(databaseUrl);
  pool.on("error", (error) => {
    app.log.error({ err: error }, "Unexpected database connection error");
  });
  app.decorate("db", db);
  app.addHook("onClose", async () => {
    await pool.end();
  });
}
