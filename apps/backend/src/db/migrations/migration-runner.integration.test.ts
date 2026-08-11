import assert from "node:assert/strict";
import { before, test } from "node:test";

import { database } from "../pool.js";
import { isDatabaseAvailable } from "../../test-support/db-test-helpers.js";
import { migrations } from "./index.js";
import { runMigrations } from "./migration-runner.js";

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
