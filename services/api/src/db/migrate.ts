import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";
import { pino } from "pino";

/** The migrations folder, resolved the same way from src/db and dist/db. */
export const MIGRATIONS_DIR = fileURLToPath(
  new URL("../../database/migrations", import.meta.url),
);

const MIGRATION_FILE_PATTERN = /^\d{4}_[a-z0-9_]+\.sql$/;

/** Arbitrary constant identifying the advisory lock that stops two migration runs at once. */
const MIGRATION_LOCK_KEY = 7_331_001;

interface Migration {
  name: string;
  sql: string;
  checksum: string;
}

/** Reads every migration file in name order, with a checksum of its contents. */
async function readMigrations(directory: string): Promise<Migration[]> {
  const names = (await readdir(directory))
    .filter((name) => MIGRATION_FILE_PATTERN.test(name))
    .sort();
  return Promise.all(
    names.map(async (name) => {
      const sql = (await readFile(join(directory, name), "utf8")).replaceAll(
        "\r\n",
        "\n",
      );
      return {
        name,
        sql,
        checksum: createHash("sha256").update(sql).digest("hex"),
      };
    }),
  );
}

/** Runs one migration and records it, rolling back both if anything fails. */
async function applyMigration(
  client: pg.Client,
  migration: Migration,
): Promise<void> {
  await client.query("BEGIN");
  try {
    await client.query(migration.sql);
    await client.query(
      "INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)",
      [migration.name, migration.checksum],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw new Error(`Migration ${migration.name} failed and was rolled back.`, {
      cause: error,
    });
  }
}

/** Applies every migration not yet applied, in order, and returns the names of the ones it applied. */
export async function runMigrations(
  connectionString: string,
  directory = MIGRATIONS_DIR,
): Promise<string[]> {
  const migrations = await readMigrations(directory);
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const { rows } = await client.query<{ name: string; checksum: string }>(
      "SELECT name, checksum FROM schema_migrations",
    );
    const appliedChecksums = new Map(
      rows.map((row) => [row.name, row.checksum]),
    );

    const newlyApplied: string[] = [];
    for (const migration of migrations) {
      const appliedChecksum = appliedChecksums.get(migration.name);
      if (appliedChecksum === undefined) {
        await applyMigration(client, migration);
        newlyApplied.push(migration.name);
      } else if (appliedChecksum !== migration.checksum) {
        throw new Error(
          `Migration ${migration.name} was changed after it was applied. Add a new migration instead.`,
        );
      }
    }
    return newlyApplied;
  } finally {
    await client.end();
  }
}

if (import.meta.main) {
  const logger = pino();
  const connectionString = process.env.MIGRATION_DATABASE_URL;
  if (connectionString === undefined || connectionString === "") {
    throw new Error(
      "Set MIGRATION_DATABASE_URL (see services/api/.env.example).",
    );
  }
  const applied = await runMigrations(connectionString);
  logger.info(
    { applied },
    applied.length > 0
      ? "Applied migrations"
      : "Database is already up to date",
  );
}
