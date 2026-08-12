import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import {
  requireCurrentUser,
  respondWithValidationError,
} from "../../lib/route-helpers.js";
import {
  getFinanceInputsForUser,
  upsertFinanceInputsForUser,
} from "./finance.repository.js";

export const financeRouter = Router();

const financeInputsSchema = z
  .object({
    incomeInput: z.string().max(30),
    expenseInput: z.string().max(30),
    monthlyFixedCostsInput: z.string().max(30),
    fuelGallonsInput: z.string().max(30),
    fuelPriceInput: z.string().max(30),
    milesPerWeekInput: z.string().max(30),
    combinedMpgInput: z.string().max(30),
    tankCapacityInput: z.string().max(30),
    currentTankPercentInput: z.string().max(30),
  })
  .strict();

financeRouter.use(requireAuth, syncCurrentUser);

/**
 * Returns the authenticated user's persisted finance planner inputs.
 */
financeRouter.get("/inputs", async (request, response, next) => {
  const currentUser = requireCurrentUser(request, response);

  if (!currentUser) {
    return;
  }

  try {
    const inputs = await getFinanceInputsForUser(currentUser.id);
    response.status(200).json({ inputs });
  } catch (error) {
    next(error);
  }
});

/**
 * Upserts the authenticated user's finance planner inputs.
 */
financeRouter.put("/inputs", async (request, response, next) => {
  const currentUser = requireCurrentUser(request, response);

  if (!currentUser) {
    return;
  }

  const validationResult = financeInputsSchema.safeParse(request.body);

  if (!validationResult.success) {
    respondWithValidationError(
      response,
      validationResult.error,
      "Invalid finance inputs",
    );
    return;
  }

  try {
    const inputs = await upsertFinanceInputsForUser(
      currentUser.id,
      validationResult.data,
    );
    response.status(200).json({ inputs });
  } catch (error) {
    next(error);
  }
});
