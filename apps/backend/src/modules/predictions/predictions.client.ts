import type { BudgetPrediction } from "@thinktwice/shared-types";

import { env } from "../../config/env.js";
import type { BudgetEntry } from "../budget/budget.repository.js";

// The subset of a budget entry the ML service's /predict endpoint needs.
export type ForecastEntryInput = Pick<
  BudgetEntry,
  "entryDate" | "fuelCost" | "foodCost" | "milesDriven" | "meals"
>;

export type ForecastOutcome =
  // The ML service returned a usable prediction.
  | { status: "ok"; prediction: BudgetPrediction }
  // The ML service reached us but couldn't process the request (non-2xx).
  | { status: "service-error" }
  // The ML service was unreachable (network failure, DNS, connection refused).
  | { status: "unreachable" };

// Calls the ML service's /predict endpoint with the given budget
// entries and classifies the outcome. Any error other than a
// network-level failure is rethrown for the caller to handle -
// callers wrapped in asyncHandler will forward it to Express's error
// middleware, matching the previous inline behavior.
export async function requestForecast(
  entries: ForecastEntryInput[],
): Promise<ForecastOutcome> {
  let mlResponse: Response;

  try {
    mlResponse = await fetch(`${env.ML_SERVICE_URL}/predict`, {
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
  } catch (error) {
    // fetch() throws a TypeError for network-level failures (service
    // unreachable, connection refused, DNS failure).
    if (error instanceof TypeError) {
      return { status: "unreachable" };
    }

    throw error;
  }

  if (!mlResponse.ok) {
    return { status: "service-error" };
  }

  const prediction = (await mlResponse.json()) as BudgetPrediction;

  return { status: "ok", prediction };
}
