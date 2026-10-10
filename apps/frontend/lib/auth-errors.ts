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

// Maps a Google sign-in failure to a user-facing message, or null when
// nothing should be shown (a second tap while one sign-in is already
// open). Codes are the raw strings @react-native-google-signin sends from
// Android ("10" is Google's DEVELOPER_ERROR: this build's signing key
// SHA-1 isn't registered), compared as strings so this file never pulls
// the native module into the web bundle. Firebase errors from the
// credential exchange fall through to getAuthErrorMessage.
export function getGoogleSignInErrorMessage(error: unknown): string | null {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "ASYNC_OP_IN_PROGRESS":
      return null;
    case "PLAY_SERVICES_NOT_AVAILABLE":
      return "Google sign-in needs Google Play services. Update them, or sign in with email.";
    case "10":
      return "Google sign-in isn't set up for this version of the app yet. Sign in with email for now.";
    case "auth/account-exists-with-different-credential":
      return "That email already has a ThinkTwice account. Sign in with your email and password.";
    default:
      return getAuthErrorMessage(error, "Unable to sign in with Google. Please try again.");
  }
}
