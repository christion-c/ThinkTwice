// Returns the single row from a query result that should always yield
// exactly one row (e.g. `INSERT ... RETURNING`), or throws with a
// message naming what was expected - repositories call this rather
// than repeating the same "should always yield exactly one row" guard
// after every such query.
export function expectOneRow<T>(result: { rows: T[] }, entityName: string): T {
  const row = result.rows[0];

  if (!row) {
    throw new Error(`PostgreSQL did not return the ${entityName}.`);
  }

  return row;
}

// NUMERIC columns come back from the pg driver as strings (to avoid
// silent precision loss); converts one to a number, preserving null
// rather than coercing it to 0. Overloaded so a non-nullable NUMERIC
// column (typed `string`) converts to a plain `number`, while a
// nullable one (typed `string | null`) keeps `null` in its type.
export function numericOrNull(value: string): number;
export function numericOrNull(value: string | null): number | null;
export function numericOrNull(value: string | null): number | null {
  return value === null ? null : Number(value);
}

// Postgres SQLSTATE codes for the two error classes its own docs say
// applications must be prepared to retry: 40P01 (deadlock_detected)
// and 40001 (serialization_failure) - both mean "no bug happened, two
// transactions genuinely contended for the same rows/locks and
// Postgres picked one to abort," not a real failure. Confirmed
// reachable here, not theoretical: the migration runner's own
// CREATE TABLE ... REFERENCES users(id) can deadlock against a
// concurrent DELETE FROM users ON DELETE CASCADE (see
// migration-runner.ts and test-support/db-test-helpers.ts, both of
// which retry through this).
export function isRetryablePostgresError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code !== undefined &&
    ["40P01", "40001"].includes((error as { code?: string }).code as string)
  );
}

// Retries a Postgres operation a few times, with a short random
// backoff, when it fails with a retryable (deadlock/serialization)
// error - anything else (a genuine bug, a constraint violation, etc.)
// rethrows immediately without retrying.
export async function withPostgresRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts || !isRetryablePostgresError(error)) {
        throw error;
      }

      const backoffMs = 25 * attempt + Math.random() * 25;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  // Unreachable - the loop above always either returns or throws.
  throw new Error(
    "withPostgresRetry exhausted its attempts without returning or throwing.",
  );
}
