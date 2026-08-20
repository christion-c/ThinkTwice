import { Router } from "express";

import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import { withCurrentUser } from "../../lib/route-helpers.js";

export const authRouter = Router();

// Returns the authenticated user's ThinkTwice profile.
authRouter.get(
  "/me",
  requireAuth,
  syncCurrentUser,
  withCurrentUser(async (currentUser, request, response) => {
    response.status(200).json({
      user: currentUser,
    });
  }),
);