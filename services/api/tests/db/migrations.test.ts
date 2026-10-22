import { copyFile, mkdtemp, rm, writeFile, appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { MIGRATIONS_DIR, runMigrations } from "../../src/db/migrate.ts";
import { queryOnce, testDatabaseUrls } from "../helpers/database.ts";

const urls = testDatabaseUrls();
const INITIAL_MIGRATION = "0001_initial_schema.sql";

let temporaryDirectory: string | undefined;

afterEach(async () => {
  if (temporaryDirectory !== undefined) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    temporaryDirectory = undefined;
  }
});

/** Creates a temporary migrations folder containing a copy of the real initial migration. */
async function copyOfMigrations(): Promise<string> {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "thinktwice-migrations-"));
  await copyFile(
    join(MIGRATIONS_DIR, INITIAL_MIGRATION),
    join(temporaryDirectory, INITIAL_MIGRATION),
  );
  return temporaryDirectory;
}

describe("runMigrations", () => {
  it("applies nothing when the database is up to date", async () => {
    expect(await runMigrations(urls.owner)).toEqual([]);
  });

  it("refuses to run when an applied migration has been edited", async () => {
    const directory = await copyOfMigrations();
    await appendFile(
      join(directory, INITIAL_MIGRATION),
      "\n-- edited after being applied\n",
    );
    await expect(runMigrations(urls.owner, directory)).rejects.toThrow(
      `Migration ${INITIAL_MIGRATION} was changed after it was applied`,
    );
  });

  it("rolls back a migration that fails partway through", async () => {
    const directory = await copyOfMigrations();
    await writeFile(
      join(directory, "0002_broken.sql"),
      "CREATE TABLE migration_rollback_check (id int);\nSELECT 1 / 0;\n",
    );
    await expect(runMigrations(urls.owner, directory)).rejects.toThrow(
      "Migration 0002_broken.sql failed and was rolled back.",
    );

    const { rows } = await queryOnce<{
      table_exists: boolean;
      recorded: boolean;
    }>(
      urls.owner,
      `SELECT to_regclass('migration_rollback_check') IS NOT NULL AS table_exists,
              EXISTS (SELECT 1 FROM schema_migrations WHERE name = '0002_broken.sql') AS recorded`,
    );
    expect(rows).toEqual([{ table_exists: false, recorded: false }]);
  });
});
