/** PostgreSQL error codes the API (and its tests) check for. */
export const PostgresErrorCode = {
  insufficientPrivilege: "42501",
  foreignKeyViolation: "23503",
  uniqueViolation: "23505",
  checkViolation: "23514",
} as const;

/** Returns the PostgreSQL error code on an error or anywhere in its chain of causes (Drizzle wraps them). */
export function postgresErrorCode(error: unknown): string | undefined {
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
