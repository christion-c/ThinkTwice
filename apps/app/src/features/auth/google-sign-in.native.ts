// iOS and Android version (the web uses google-sign-in.ts). On Android, Google's Credential Manager shows the
// account picker; the Google ID token it returns signs in to Firebase.
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";

import {
  GoogleSignIn,
  GoogleSignInErrorCode,
} from "../../../modules/google-sign-in";
import { getConfig } from "../../lib/config";
import { getFirebaseAuth } from "../../lib/firebase";
import {
  GoogleSignInError,
  type GoogleSignInResult,
} from "./google-sign-in-result";

export {
  GoogleSignInError,
  type GoogleSignInResult,
} from "./google-sign-in-result";

/** Returns the native module's error code, if the error came from it. */
function nativeErrorCode(error: unknown): string | undefined {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : undefined;
}

/** Signs in with Google through the device's account picker. */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const webClientId = getConfig().googleWebClientId;
  if (GoogleSignIn === null || webClientId === undefined) {
    throw new GoogleSignInError(
      "Google sign-in isn't available in this version of the app yet. Sign in with your email and password for now.",
    );
  }

  let idToken: string;
  try {
    idToken = await GoogleSignIn.signInAsync(webClientId);
  } catch (error) {
    const code = nativeErrorCode(error);
    if (code === GoogleSignInErrorCode.cancelled) {
      return "cancelled";
    }
    if (code === GoogleSignInErrorCode.noAccount) {
      throw new GoogleSignInError(
        "Add a Google account to this device first, then try again.",
        { cause: error },
      );
    }
    throw new GoogleSignInError(
      "Google sign-in didn't work. Please try again.",
      { cause: error },
    );
  }

  await signInWithCredential(
    getFirebaseAuth(),
    GoogleAuthProvider.credential(idToken),
  );
  return "signedIn";
}

/** Forgets the Google account chosen last time, so signing in again shows the account picker. */
export async function forgetGoogleAccount(): Promise<void> {
  await GoogleSignIn?.signOutAsync();
}
