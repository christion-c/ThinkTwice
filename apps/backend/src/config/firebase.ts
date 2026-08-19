import {
  applicationDefault,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// getApps().length > 0 means Firebase already initialized once - reuse
// that instance instead of throwing, which is what a second
// initializeApp() call would do. Can happen during dev reloads or tests.
// applicationDefault() reads credentials from the ambient environment:
// the impersonated service account's Application Default Credentials
// locally (see apps/backend/README.md), or Cloud Run's attached service
// account identity in production - no key file either way.
const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: applicationDefault(),
      });

// Shared Firebase Authentication service, used by
// middleware/require-auth.ts to verify Firebase ID tokens from the frontend.
export const firebaseAuth = getAuth(firebaseApp);
