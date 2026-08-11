import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
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
  const currentUser = request.currentUser;

  if (!currentUser) {
    response.status(500).json({ error: "User profile unavailable" });
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
  const currentUser = request.currentUser;

  if (!currentUser) {
    response.status(500).json({ error: "User profile unavailable" });
    return;
  }

  const validationResult = financeInputsSchema.safeParse(request.body);

  if (!validationResult.success) {
    response.status(400).json({
      error: "Invalid finance inputs",
      details: validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
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
