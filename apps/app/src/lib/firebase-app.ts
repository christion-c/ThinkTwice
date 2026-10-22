import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

import { getConfig } from "./config";

/** Returns the app's single Firebase instance, creating it on first use. */
export function getFirebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(getConfig().firebase);
}
