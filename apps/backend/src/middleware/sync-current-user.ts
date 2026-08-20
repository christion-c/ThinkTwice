import type { RequestHandler } from "express";

import { asyncHandler } from "../lib/route-helpers.js";
import { upsertUserFromFirebase } from "../modules/users/user.repository.js";

// Creates or updates the PostgreSQL profile belonging to the verified
// Firebase user and attaches it to the current request. Must run after
// requireAuth, since it reads request.auth.
export const syncCurrentUser: RequestHandler = asyncHandler(async (
  request,
  response,
  next,
) => {
  const authenticatedUser = request.auth;

  // requireAuth should have set this already; guard anyway in case this
  // middleware gets mounted on a route without it.
  if (!authenticatedUser) {
    response.status(401).json({
      error: "Authentication required",
    });
    return;
  }

  // Insert on first sign-in, or update on every subsequent request -
  // keeps the local profile in sync with whatever Firebase has now.
  request.currentUser = await upsertUserFromFirebase({
    firebaseUid: authenticatedUser.uid,
    email: authenticatedUser.email ?? null,
    displayName: authenticatedUser.name ?? null,
    photoUrl: authenticatedUser.picture ?? null,
    emailVerified: authenticatedUser.email_verified ?? false,
  });

  // Profile synced - continue to the actual route handler.
  next();
});
