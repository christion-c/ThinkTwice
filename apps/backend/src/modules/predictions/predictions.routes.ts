import { Router } from "express";

import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import { withCurrentUser } from "../../lib/route-helpers.js";
import { listBudgetEntriesForUser } from "../budget/budget.repository.js";
import { requestForecast } from "./predictions.client.js";

export const predictionsRouter = Router();

// Below this many logged days, a linear-regression forecast is
// unreliable enough that the ML service falls back to a plain average.
// Skipping the network call entirely at that point keeps the response
// fast and the message encouraging rather than an error.
const MIN_ENTRIES_FOR_FORECAST = 3;
// How many of the user's most recent budget entries to send the ML service.
const ENTRIES_CONSIDERED = 60;

// Every route below requires a verified, synced user.
predictionsRouter.use(requireAuth, syncCurrentUser);

// Returns a spending forecast for the authenticated user, built from
// their logged budget entries by the ML service.
predictionsRouter.get(
  "/",
  withCurrentUser(async (currentUser, request, response) => {
    // Pull the user's most recent entries to send to the ML service.
    const entries = await listBudgetEntriesForUser(
      currentUser.id,
      ENTRIES_CONSIDERED,
    );

    // Not enough data yet - skip the ML call and say so.
    if (entries.length < MIN_ENTRIES_FOR_FORECAST) {
      response.status(200).json({
        available: false,
        message:
          "Log a few more days of fuel and food costs to unlock a personalized forecast.",
      });
      return;
    }

    const outcome = await requestForecast(entries);

    if (outcome.status === "unreachable") {
      response.status(502).json({
        error: "The prediction service is currently unreachable",
      });
      return;
    }

    // The ML service reached us but couldn't produce a prediction.
    if (outcome.status === "service-error") {
      response.status(502).json({
        error: "The prediction service could not process this request",
      });
      return;
    }

    // Success - hand the prediction back to the frontend.
    response.status(200).json({
      available: true,
      prediction: outcome.prediction,
    });
  }),
);
