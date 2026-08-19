import type { DecodedIdToken } from "firebase-admin/auth";

import type { UserProfile } from "../modules/users/user.repository.js";

declare global {
  namespace Express {
    interface Request {
      // Verified Firebase token, added by requireAuth.
      auth?: DecodedIdToken;
      // ThinkTwice PostgreSQL profile, added by syncCurrentUser.
      currentUser?: UserProfile;
    }
  }
}

export {};
