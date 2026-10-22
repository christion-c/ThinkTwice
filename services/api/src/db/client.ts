import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema.ts";

/** Most connections the API holds open to PostgreSQL at once. */
const MAX_CONNECTIONS = 10;

/** Opens a connection pool and returns it with a Drizzle database bound to it. */
export function createDatabase(connectionString: string) {
  const pool = new pg.Pool({ connectionString, max: MAX_CONNECTIONS });
  return { db: drizzle({ client: pool, schema }), pool };
}

export type Database = ReturnType<typeof createDatabase>["db"];
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
