import { randomUUID } from "node:crypto";

import { database } from "../db/pool.js";
import { migrations } from "../db/migrations/index.js";
import { runMigrations } from "../db/migrations/migration-runner.js";

/**
 * Integration tests need a real PostgreSQL instance. Rather than failing
 * the whole suite when one isn't reachable (e.g. a laptop with Docker not
 * running), tests check this once and skip themselves with a clear
 * message.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await database.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

/**
 * Confirms a database is reachable and applies migrations against it.
 *
 * Node's test runner executes separate test files concurrently by
 * default, so each integration-test file must make sure the schema it
 * needs actually exists rather than assuming another file's `before` hook
 * ran first. runMigrations is safe to call concurrently from multiple
 * files: the migration runner takes a PostgreSQL advisory lock.
 */
export async function ensureSchemaReady(): Promise<boolean> {
  const available = await isDatabaseAvailable();

  if (!available) {
    return false;
  }

  await runMigrations(migrations);
  return true;
}

/**
 * Inserts a throwaway user for a single test. Callers are responsible for
 * deleting it (see deleteTestUser) so repeated test runs don't accumulate
 * rows in a shared development database.
 */
export async function createTestUser(): Promise<string> {
  const firebaseUid = `test-${randomUUID()}`;

  const result = await database.query<{ id: string }>(
    `
      INSERT INTO users (firebase_uid, email)
      VALUES ($1, $2)
      RETURNING id
    `,
    [firebaseUid, `${firebaseUid}@example.test`],
  );

  const userId = result.rows[0]?.id;

  if (!userId) {
    throw new Error("Failed to create test user.");
  }

  return userId;
}

export async function deleteTestUser(userId: string): Promise<void> {
  await database.query("DELETE FROM users WHERE id = $1", [userId]);
}
