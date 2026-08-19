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
 * applicationDefault() reads credentials from the ambient environment:
 * the impersonated service account's Application Default Credentials
 * locally (see apps/backend/README.md), or Cloud Run's attached service
 * account identity in production - no key file either way.
 */
const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: applicationDefault(),
      });

/**
 * Shared Firebase Authentication service, used by middleware/require-auth.ts
 * to verify Firebase ID tokens sent from the frontend.
 */
export const firebaseAuth = getAuth(firebaseApp);