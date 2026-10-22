import { expect } from "vitest";

import { postgresErrorCode } from "../../src/db/postgres-errors.ts";

export { PostgresErrorCode } from "../../src/db/postgres-errors.ts";

/** Asserts that a database operation fails with the given PostgreSQL error code. */
export async function expectPostgresError(
  operation: Promise<unknown>,
  code: string,
): Promise<void> {
  const error = await operation.then(
    () => undefined,
    (rejection: unknown) => rejection,
  );
  expect(
    error,
    `expected PostgreSQL error ${code}, but the operation succeeded`,
  ).toBeDefined();
  expect(postgresErrorCode(error)).toBe(code);
}
