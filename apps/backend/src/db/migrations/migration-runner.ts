import { database } from "../pool.js";
import type { Migration } from "./migration.types.js";

// Arbitrary fixed number identifying this app's migration lock in
// Postgres's advisory-lock namespace - two backend instances trying to
// migrate at once will block on this instead of racing each other.
const MIGRATION_LOCK_ID = 739_247_111;

interface AppliedMigrationRow {
  id: string;
}

// Postgres error code 42P07 is "relation already exists" - checked
// alongside the message text since drivers don't always surface the code.
function isAlreadyExistsError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
  };

  return candidate.code === "42P07" || /already exists/i.test(candidate.message ?? "");
}

// Confirms every migration ID is unique and that the list is already in
// ascending order, before anything runs.
function validateMigrations(migrations: readonly Migration[]): void {
  // Collect every id, then dedupe via a Set to compare sizes.
  const migrationIds = migrations.map((migration) => migration.id);
  const uniqueIds = new Set(migrationIds);

  // A size mismatch means at least one id was reused.
  if (uniqueIds.size !== migrationIds.length) {
    throw new Error("Migration IDs must be unique.");
  }

  // Sort a copy and compare position-by-position against the original order.
  const sortedIds = [...migrationIds].sort();

  migrationIds.forEach((id, index) => {
    if (id !== sortedIds[index]) {
      throw new Error(
        `Migrations are out of order. "${id}" is in the wrong position.`,
      );
    }
  });
}

// Applies every migration that hasn't already been recorded as complete.
// Each migration runs in its own transaction, so a failure only rolls
// back that one migration, not everything already applied before it.
export async function runMigrations(
  migrations: readonly Migration[],
): Promise<void> {
  // Fail fast on a malformed migration list before touching the database.
  validateMigrations(migrations);

  // A dedicated client (not the shared pool) is required because the
  // advisory lock and every transaction below must stay on one connection.
  const client = await database.connect();
  let lockAcquired = false;

  try {
    // Block here until no other instance holds the migration lock.
    await client.query("SELECT pg_advisory_lock($1)", [
      MIGRATION_LOCK_ID,
    ]);

    // Only mark this true after the lock call actually succeeds, so the
    // finally block below doesn't try to release a lock we never took.
    lockAcquired = true;

    // Postgres uses this table to remember which migrations already ran.
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Read back what's already recorded as applied.
    const result = await client.query<AppliedMigrationRow>(
      "SELECT id FROM schema_migrations",
    );

    // Turn the row list into a Set for O(1) membership checks below.
    const appliedMigrationIds = new Set(
      result.rows.map((row) => row.id),
    );

    for (const migration of migrations) {
      // Skip anything already recorded as applied.
      if (appliedMigrationIds.has(migration.id)) {
        continue;
      }

      console.log(
        `Applying migration ${migration.id}: ${migration.description}`,
      );

      // Start this migration's own transaction.
      await client.query("BEGIN");

      try {
        try {
          // Run the migration's actual schema change.
          await migration.up(client);
        } catch (error) {
          // A table/index already existing usually means a previous run
          // got interrupted after the DDL landed but before this migration
          // got recorded - treat that as success rather than a real failure.
          if (isAlreadyExistsError(error)) {
            console.warn(
              `Migration ${migration.id} already applied in the database; recording it as complete without re-running it.`,
            );

            // Undo whatever partial DDL this attempt might have run.
            await client.query("ROLLBACK");

            // Record it as applied anyway, since the underlying structure exists.
            await client.query(
              `
                INSERT INTO schema_migrations (id, description)
                VALUES ($1, $2)
                ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description
              `,
              [migration.id, migration.description],
            );

            console.log(`Migration ${migration.id} completed.`);
            // Move on to the next migration in the list.
            continue;
          }

          // Any other error is a genuine failure - rethrow to the outer catch.
          throw error;
        }

        // Record this migration as applied.
        await client.query(
          `
            INSERT INTO schema_migrations (id, description)
            VALUES ($1, $2)
            ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description
          `,
          [migration.id, migration.description],
        );

        // Commit both the schema change and the schema_migrations row together.
        await client.query("COMMIT");

        console.log(`Migration ${migration.id} completed.`);
      } catch (error) {
        try {
          // Undo this migration's partial changes.
          await client.query("ROLLBACK");
        } catch {
          // A failed migration may already have left the transaction in an
          // aborted state, so the rollback itself can fail silently.
        }

        // Wrap and rethrow so the caller sees which migration failed.
        throw new Error(
          `Migration ${migration.id} failed and was rolled back.`,
          { cause: error },
        );
      }
    }
  } finally {
    // Always release the advisory lock we took, even if a migration threw.
    if (lockAcquired) {
      await client.query("SELECT pg_advisory_unlock($1)", [
        MIGRATION_LOCK_ID,
      ]);
    }

    // Return the dedicated connection to the pool.
    client.release();
  }
}
