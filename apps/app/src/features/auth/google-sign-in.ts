// Web version (Metro uses google-sign-in.native.ts on iOS and Android): Firebase shows Google's own pop-up.
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { getFirebaseAuth } from "../../lib/firebase";
import type { GoogleSignInResult } from "./google-sign-in-result";

export {
  GoogleSignInError,
  type GoogleSignInResult,
} from "./google-sign-in-result";

const CANCELLED_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

/** Signs in with Google in a pop-up window. */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  try {
    await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    return "signedIn";
  } catch (error) {
    if (error instanceof FirebaseError && CANCELLED_CODES.has(error.code)) {
      return "cancelled";
    }
    throw error;
  }
}

/** Nothing to forget on the web: the browser handles Google's session, so this resolves immediately. */
export function forgetGoogleAccount(): Promise<void> {
  return Promise.resolve();
}
