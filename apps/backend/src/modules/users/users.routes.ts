import { Router } from "express";

import { firebaseAuth } from "../../config/firebase.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import { withCurrentUser } from "../../lib/route-helpers.js";
import { deleteUserById } from "./users.repository.js";

export const usersRouter = Router();

// Every route here requires a verified Firebase user.
usersRouter.use(requireAuth, syncCurrentUser);

// Permanently deletes the authenticated user's account: their ThinkTwice
// profile and everything it cascades to (vehicles, budget entries,
// finance inputs, fill-up history, daily driving logs), plus their
// Firebase Auth login. Irreversible - the frontend is expected to
// confirm with the user before calling this.
usersRouter.delete(
  "/me",
  withCurrentUser(async (currentUser, request, response) => {
    // Postgres first, Firebase second: if Firebase's delete then fails,
    // the user's data is still fully gone (the part that matters most
    // for a deletion request), and this is safe to retry - a retry's
    // own syncCurrentUser just recreates a fresh empty profile row
    // immediately before this handler deletes it again.
    await deleteUserById(currentUser.id);

    try {
      await firebaseAuth.deleteUser(currentUser.firebaseUid);
    } catch (error) {
      console.error("Deleted user data but failed to delete the Firebase account:", error);
      response.status(500).json({
        error: "Your data was deleted, but removing your login failed. Please try again.",
      });
      return;
    }

    response.status(204).send();
  }),
);
