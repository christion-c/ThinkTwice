// Maps a Firebase Auth error to a user-facing message. Covers the union of
// error codes seen across login and registration - the codes are mutually
// exclusive in practice (each is only ever raised by one of those two
// operations), so sharing this list is safe. `defaultMessage` lets each
// call site keep its own fallback copy for unrecognized codes.
export function getAuthErrorMessage(error: unknown, defaultMessage: string): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email or password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/email-already-in-use":
      return "That email is already in use.";
    case "auth/weak-password":
      return "Password is too weak. Use a stronger one.";
    default:
      return defaultMessage;
  }
}
