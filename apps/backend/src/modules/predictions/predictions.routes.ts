import { Router } from "express";

import type { BudgetPrediction } from "@thinktwice/shared-types";

import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import { requireCurrentUser } from "../../lib/route-helpers.js";
import { listBudgetEntriesForUser } from "../budget/budget.repository.js";

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
predictionsRouter.get("/", async (request, response, next) => {
  const currentUser = requireCurrentUser(request, response);

  if (!currentUser) {
    return;
  }

  try {
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

    // Forward the entries to the ML service's prediction endpoint.
    const mlResponse = await fetch(`${env.ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entries: entries.map((entry) => ({
          date: entry.entryDate,
          fuelCost: entry.fuelCost,
          foodCost: entry.foodCost,
          milesDriven: entry.milesDriven,
          meals: entry.meals,
        })),
      }),
    });

    // The ML service reached us but couldn't produce a prediction.
    if (!mlResponse.ok) {
      response.status(502).json({
        error: "The prediction service could not process this request",
      });
      return;
    }

    const prediction = (await mlResponse.json()) as BudgetPrediction;

    // Success - hand the prediction back to the frontend.
    response.status(200).json({
      available: true,
      prediction,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      // fetch() throws a TypeError for network-level failures (service
      // unreachable, connection refused, DNS failure).
      response.status(502).json({
        error: "The prediction service is currently unreachable",
      });
      return;
    }

    next(error);
  }
});
