import { expect } from "vitest";

/** PostgreSQL error codes the tests check for. */
export const PostgresErrorCode = {
  insufficientPrivilege: "42501",
  foreignKeyViolation: "23503",
  uniqueViolation: "23505",
  checkViolation: "23514",
} as const;

/** Finds the PostgreSQL error code on an error or anywhere in its chain of causes. */
function findPostgresCode(error: unknown): string | undefined {
  let current: unknown = error;
  while (typeof current === "object" && current !== null) {
    if (
      "code" in current &&
      typeof current.code === "string" &&
      /^[0-9A-Z]{5}$/.test(current.code)
    ) {
      return current.code;
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return undefined;
}

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
  expect(findPostgresCode(error)).toBe(code);
}
