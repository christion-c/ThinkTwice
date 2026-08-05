import type { RequestHandler } from "express";

import { upsertUserFromFirebase } from "../modules/users/user.repository.js";

/**
 * Creates or updates the PostgreSQL profile belonging to the verified
 * Firebase user and attaches it to the current request.
 *
 * This middleware must run after requireAuth.
 */
export const syncCurrentUser: RequestHandler = async (
  request,
  response,
  next,
) => {
  const authenticatedUser = request.auth;

  if (!authenticatedUser) {
    response.status(401).json({
      error: "Authentication required",
    });
    return;
  }

  try {
    request.currentUser = await upsertUserFromFirebase({
      firebaseUid: authenticatedUser.uid,
      email: authenticatedUser.email ?? null,
      displayName: authenticatedUser.name ?? null,
      photoUrl: authenticatedUser.picture ?? null,
      emailVerified: authenticatedUser.email_verified ?? false,
    });

    next();
  } catch (error) {
    next(error);
  }
};