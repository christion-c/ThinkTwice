import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import { withCurrentUser } from "../../lib/route-helpers.js";
import { listBudgetEntriesForUser } from "../budget/budget.repository.js";
import { requestForecast, requestPreview } from "./predictions.client.js";

export const predictionsRouter = Router();

// Below this many logged days, a trend (cost-per-mile) forecast is
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

const previewQuerySchema = z.object({
  miles_driven: z.coerce.number().int().positive().default(120),
});

// Debug-only preview flow (backs app/ml-preview.tsx and
// app/debug/ml-account.tsx). Proxies to the ML service's own
// /ml-preview so the frontend never needs the internal service token
// itself, and always requests the caller's own history - a client
// can't ask for anyone else's.
predictionsRouter.get(
  "/preview",
  withCurrentUser(async (currentUser, request, response) => {
    const parsedQuery = previewQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      response.status(400).json({ error: "Invalid miles_driven" });
      return;
    }

    const outcome = await requestPreview(
      currentUser.firebaseUid,
      parsedQuery.data.miles_driven,
    );

    if (outcome.status === "unreachable") {
      response.status(502).json({
        error: "The preview service is currently unreachable",
      });
      return;
    }

    if (outcome.status === "service-error") {
      response.status(502).json({
        error: "The preview service could not process this request",
      });
      return;
    }

    response.status(200).json(outcome.preview);
  }),
);
