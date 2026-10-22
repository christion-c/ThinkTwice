import { existsSync } from "node:fs";

import pg from "pg";

const ENV_FILE = new URL("../../.env", import.meta.url);

/** Returns an environment variable, explaining how to set it if it's missing. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(
      `${name} is not set. Start the database with "docker compose up --detach --wait" and copy services/api/.env.example to services/api/.env (see docs/setup.md).`,
    );
  }
  return value;
}

/** Returns the test database URLs for the app role and the owner role, loading services/api/.env if present. */
export function testDatabaseUrls(): { app: string; owner: string } {
  if (existsSync(ENV_FILE)) {
    process.loadEnvFile(ENV_FILE);
  }
  return {
    app: requireEnv("TEST_DATABASE_URL"),
    owner: requireEnv("TEST_MIGRATION_DATABASE_URL"),
  };
}

/** Runs one query on a fresh connection and closes it. */
export async function queryOnce<Row extends pg.QueryResultRow>(
  connectionString: string,
  text: string,
  values: unknown[] = [],
): Promise<pg.QueryResult<Row>> {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    return await client.query<Row>(text, values);
  } finally {
    await client.end();
  }
}

/** Deletes every row from every table, so each test starts from an empty database. */
export async function resetDatabase(ownerUrl: string): Promise<void> {
  await queryOnce(ownerUrl, "TRUNCATE users, categories, expenses");
}
