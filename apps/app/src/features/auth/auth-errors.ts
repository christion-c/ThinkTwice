// Turns Firebase sign-in errors into short, friendly messages (see "Writing style" in docs/design-guide.md).
import { FirebaseError } from "firebase/app";

import { GoogleSignInError } from "./google-sign-in-result";

const MESSAGES: Partial<Record<string, string>> = {
  "auth/invalid-credential":
    "That email and password don't match. Try again, or reset your password.",
  "auth/wrong-password":
    "That email and password don't match. Try again, or reset your password.",
  "auth/user-not-found":
    "That email and password don't match. Try again, or reset your password.",
  "auth/invalid-email":
    "That doesn't look like an email address. Check it and try again.",
  "auth/missing-password": "Enter your password to continue.",
  "auth/email-already-in-use":
    "There's already an account with that email. Try signing in instead.",
  "auth/weak-password": "Choose a longer password: at least 8 characters.",
  "auth/too-many-requests":
    "Too many tries in a row. Take a short break, then try again.",
  "auth/network-request-failed":
    "We couldn't reach ThinkTwice. Check your connection and try again.",
  "auth/account-exists-with-different-credential":
    "That email already has a ThinkTwice account. Sign in with your email and password instead.",
  "auth/popup-blocked":
    "Your browser blocked Google's sign-in window. Allow pop-ups for this site and try again.",
  "auth/user-disabled":
    "This account has been turned off. Contact support if you think that's a mistake.",
};

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/** Returns a friendly message for a sign-in error, without exposing technical details. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof GoogleSignInError) {
    return error.message;
  }
  return error instanceof FirebaseError
    ? (MESSAGES[error.code] ?? FALLBACK_MESSAGE)
    : FALLBACK_MESSAGE;
}
