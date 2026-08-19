import { Router } from "express";

import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";

export const authRouter = Router();

// Returns the authenticated user's ThinkTwice profile.
authRouter.get(
  "/me",
  requireAuth,
  syncCurrentUser,
  (request, response) => {
    if (!request.currentUser) {
      response.status(500).json({
        error: "User profile unavailable",
      });
      return;
    }

    response.status(200).json({
      user: request.currentUser,
    });
  },
);