import assert from "node:assert/strict";
import { before, test } from "node:test";

import { database } from "../pool.js";
import { isDatabaseAvailable } from "../../test-support/db-test-helpers.js";
import { migrations } from "./index.js";
import { runMigrations } from "./migration-runner.js";
import type { Migration } from "./migration.types.js";

let dbAvailable = false;

before(async () => {
  dbAvailable = await isDatabaseAvailable();
});

test("runMigrations applies every migration and records it", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await runMigrations(migrations);

  const result = await database.query<{ id: string }>(
    "SELECT id FROM schema_migrations ORDER BY id",
  );

  const appliedIds = result.rows.map((row) => row.id);

  for (const migration of migrations) {
    assert.ok(
      appliedIds.includes(migration.id),
      `expected ${migration.id} to be recorded as applied`,
    );
  }
});

test("runMigrations is idempotent", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await runMigrations(migrations);
  await runMigrations(migrations);

  const result = await database.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM schema_migrations",
  );

  assert.equal(Number(result.rows[0]?.count), migrations.length);
});

// A test-only migration with its own throwaway table. The "existing
// table" test below used to drop and hand-recreate the real
// finance_inputs table with only some of its columns - which broke the
// finance tests running concurrently in other files, and left that
// stripped-down table behind in whatever database the tests ran against
// (by default the local Docker dev database). This probe exercises the
// same runner behavior without touching any real table. Its id sorts
// after every real migration, as runMigrations requires.
const PROBE_TABLE = "migration_runner_probe";
const probeMigration: Migration = {
  id: "zzz_migration_runner_probe",
  description: "Test-only probe table",
  async up(client) {
    await client.query(`CREATE TABLE ${PROBE_TABLE} (id INTEGER PRIMARY KEY)`);
  },
};

async function removeProbe(): Promise<void> {
  await database.query(`DROP TABLE IF EXISTS ${PROBE_TABLE}`);
  await database.query("DELETE FROM schema_migrations WHERE id = $1", [probeMigration.id]);
}

test("runMigrations marks an existing table as applied when migration history is incomplete", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await runMigrations(migrations);
  await removeProbe();

  // The table exists but its migration isn't recorded - as if it had
  // been created by hand before migrations tracked it.
  await database.query(`CREATE TABLE ${PROBE_TABLE} (id INTEGER PRIMARY KEY)`);

  try {
    await runMigrations([...migrations, probeMigration]);

    const result = await database.query<{ id: string }>(
      "SELECT id FROM schema_migrations WHERE id = $1",
      [probeMigration.id],
    );

    assert.equal(result.rows.length, 1);
  } finally {
    await removeProbe();
  }
});

test("runMigrations rejects duplicate migration IDs", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await assert.rejects(
    runMigrations([...migrations, migrations[0]!]),
    /unique/i,
  );
});
