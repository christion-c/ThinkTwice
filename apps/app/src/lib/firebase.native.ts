// iOS and Android version (the web uses firebase.ts). The sign-in is saved only in the encrypted secure store.
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from "@firebase/auth";

import { getFirebaseApp } from "./firebase-app";
import { secureStorage } from "./secure-storage";

let auth: Auth | undefined;

/** Returns Firebase Authentication, saving the sign-in in the device's secure store. */
export function getFirebaseAuth(): Auth {
  if (auth === undefined) {
    const app = getFirebaseApp();
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(secureStorage),
      });
    } catch (error) {
      // Already initialized (e.g. after a fast refresh in development): reuse it.
      if (
        error instanceof Error &&
        error.message.includes("already-initialized")
      ) {
        auth = getAuth(app);
      } else {
        throw error;
      }
    }
  }
  return auth;
}
