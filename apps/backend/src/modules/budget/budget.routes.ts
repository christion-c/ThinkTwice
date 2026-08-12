import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import {
  requireCurrentUser,
  respondWithValidationError,
} from "../../lib/route-helpers.js";
import {
  createBudgetEntry,
  deleteBudgetEntryForUser,
  listBudgetEntriesForUser,
} from "./budget.repository.js";

export const budgetRouter = Router();

const MAX_ENTRIES_RETURNED = 90;

export const createBudgetEntrySchema = z
  .object({
    entryDate: z.iso.date(),
    fuelCost: z.number().min(0).max(99_999.99).nullable().optional(),
    foodCost: z.number().min(0).max(99_999.99).nullable().optional(),
    milesDriven: z.number().min(0).max(99_999.99).nullable().optional(),
    meals: z.number().int().min(0).max(50).nullable().optional(),
  })
  .strict();

const entryIdSchema = z.uuid();

// Every budget-entry endpoint requires a verified Firebase user.
budgetRouter.use(requireAuth, syncCurrentUser);

/**
 * Returns the authenticated user's most recent budget entries.
 */
budgetRouter.get("/", async (request, response, next) => {
  const currentUser = requireCurrentUser(request, response);

  if (!currentUser) {
    return;
  }

  try {
    const entries = await listBudgetEntriesForUser(
      currentUser.id,
      MAX_ENTRIES_RETURNED,
    );

    response.status(200).json({
      entries,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Creates a budget entry owned by the authenticated user.
 */
budgetRouter.post("/", async (request, response, next) => {
  const currentUser = requireCurrentUser(request, response);

  if (!currentUser) {
    return;
  }

  const validationResult = createBudgetEntrySchema.safeParse(request.body);

  if (!validationResult.success) {
    respondWithValidationError(
      response,
      validationResult.error,
      "Invalid budget entry data",
    );
    return;
  }

  const input = validationResult.data;

  try {
    const entry = await createBudgetEntry({
      userId: currentUser.id,
      entryDate: input.entryDate,
      fuelCost: input.fuelCost ?? null,
      foodCost: input.foodCost ?? null,
      milesDriven: input.milesDriven ?? null,
      meals: input.meals ?? null,
    });

    response.status(201).json({
      entry,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Deletes a budget entry only when it belongs to the authenticated user.
 */
budgetRouter.delete("/:entryId", async (request, response, next) => {
  const currentUser = requireCurrentUser(request, response);

  if (!currentUser) {
    return;
  }

  const entryIdResult = entryIdSchema.safeParse(request.params.entryId);

  if (!entryIdResult.success) {
    response.status(400).json({
      error: "Invalid budget entry ID",
    });
    return;
  }

  try {
    const deleted = await deleteBudgetEntryForUser(
      entryIdResult.data,
      currentUser.id,
    );

    if (!deleted) {
      response.status(404).json({
        error: "Budget entry not found",
      });
      return;
    }

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});
