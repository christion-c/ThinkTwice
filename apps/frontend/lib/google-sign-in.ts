// Google sign-in for web. The native version is google-sign-in.native.ts
// (Metro picks it on Android/iOS), so the native Google Sign-In module
// never lands in the web bundle. Both files export the same API.
import { GoogleAuthProvider, signInWithPopup, type Auth } from "firebase/auth";

export type GoogleSignInResult = "signed-in" | "cancelled";

// Firebase's own popup flow needs no OAuth client ID - only the Google
// provider enabled in Firebase Auth and the site in its authorized domains.
export function isGoogleSignInConfigured(): boolean {
  return true;
}

// Closing the popup (or opening a second one) isn't an error to show.
const CANCEL_CODES = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"]);

export async function signInWithGoogle(auth: Auth): Promise<GoogleSignInResult> {
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    return "signed-in";
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (CANCEL_CODES.has(code)) {
      return "cancelled";
    }
    throw error;
  }
}

// Nothing to clear on web: Firebase's own signOut ends the session.
export async function signOutOfGoogle(): Promise<void> {}
