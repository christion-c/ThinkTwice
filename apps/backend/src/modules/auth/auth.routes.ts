import { Router } from "express";

import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import { requireCurrentUser } from "../../lib/route-helpers.js";

export const authRouter = Router();

// Returns the authenticated user's ThinkTwice profile.
authRouter.get(
  "/me",
  requireAuth,
  syncCurrentUser,
  (request, response) => {
    const currentUser = requireCurrentUser(request, response);

    if (!currentUser) {
      return;
    }

    response.status(200).json({
      user: currentUser,
    });
  },
);