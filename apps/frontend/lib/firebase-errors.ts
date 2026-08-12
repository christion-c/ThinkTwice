/**
 * Firebase Auth throws errors with a `code` like "auth/invalid-email" rather
 * than a typed error class. Each screen maps its own set of codes to
 * user-facing copy, but they all need this same unwrap first.
 */
export function getFirebaseErrorCode(error: unknown): string {
  return typeof error === "object" && error && "code" in error ? String(error.code) : "";
}
