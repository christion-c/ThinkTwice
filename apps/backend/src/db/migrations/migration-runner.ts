import { database } from "../pool.js";
import type { Migration } from "./migration.types.js";

/**
 * PostgreSQL advisory-lock identifier reserved for ThinkTwice migrations.
 *
 * The lock prevents two backend instances from attempting to migrate the
 * database simultaneously.
 */
const MIGRATION_LOCK_ID = 739_247_111;

interface AppliedMigrationRow {
  id: string;
}

/**
 * Verifies that migration IDs are unique and arranged in ascending order.
 */
function validateMigrations(migrations: readonly Migration[]): void {
  const migrationIds = migrations.map((migration) => migration.id);
  const uniqueIds = new Set(migrationIds);

  if (uniqueIds.size !== migrationIds.length) {
    throw new Error("Migration IDs must be unique.");
  }

  const sortedIds = [...migrationIds].sort();

  migrationIds.forEach((id, index) => {
    if (id !== sortedIds[index]) {
      throw new Error(
        `Migrations are out of order. "${id}" is in the wrong position.`,
      );
    }
  });
}

/**
 * Applies every database migration that has not previously been completed.
 *
 * Each migration runs inside its own PostgreSQL transaction. If a migration
 * fails, PostgreSQL rolls back that entire migration and does not record it
 * as completed.
 */
export async function runMigrations(
  migrations: readonly Migration[],
): Promise<void> {
  validateMigrations(migrations);

  // A dedicated client is required because transactions and advisory locks
  // must remain on the same PostgreSQL connection.
  const client = await database.connect();
  let lockAcquired = false;

  try {
    await client.query("SELECT pg_advisory_lock($1)", [
      MIGRATION_LOCK_ID,
    ]);

    lockAcquired = true;

    // PostgreSQL uses this table to remember completed migrations.
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await client.query<AppliedMigrationRow>(
      "SELECT id FROM schema_migrations",
    );

    const appliedMigrationIds = new Set(
      result.rows.map((row) => row.id),
    );

    for (const migration of migrations) {
      // Never run a successfully completed migration a second time.
      if (appliedMigrationIds.has(migration.id)) {
        continue;
      }

      console.log(
        `Applying migration ${migration.id}: ${migration.description}`,
      );

      await client.query("BEGIN");

      try {
        await migration.up(client);

        await client.query(
          `
            INSERT INTO schema_migrations (id, description)
            VALUES ($1, $2)
          `,
          [migration.id, migration.description],
        );

        await client.query("COMMIT");

        console.log(`Migration ${migration.id} completed.`);
      } catch (error) {
        await client.query("ROLLBACK");

        throw new Error(
          `Migration ${migration.id} failed and was rolled back.`,
          { cause: error },
        );
      }
    }
  } finally {
    if (lockAcquired) {
      await client.query("SELECT pg_advisory_unlock($1)", [
        MIGRATION_LOCK_ID,
      ]);
    }

    client.release();
  }
}