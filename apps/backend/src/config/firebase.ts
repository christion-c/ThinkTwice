import {
  applicationDefault,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/**
 * Initializes the Firebase Admin SDK.
 *
 * getApps() prevents Firebase from being initialized more than once,
 * which can happen during development reloads or automated tests.
 *
 * applicationDefault() reads credentials from the backend environment.
 * Credentials will be configured securely in the next step.
 */
const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: applicationDefault(),
      });

/**
 * Shared Firebase Authentication service.
 *
 * Future authentication middleware will use this object to verify
 * Firebase ID tokens received from the frontend.
 */
export const firebaseAuth = getAuth(firebaseApp);