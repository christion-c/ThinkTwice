// Web version (Metro uses firebase.native.ts on iOS and Android). Firebase keeps the web sign-in in IndexedDB.
import { getAuth, type Auth } from "firebase/auth";

import { getFirebaseApp } from "./firebase-app";

/** Returns Firebase Authentication for the web. */
export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
