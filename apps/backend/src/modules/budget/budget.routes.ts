import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import {
  parseRouteParam,
  respondNotFound,
  respondWithValidationError,
  withCurrentUser,
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

// Returns the authenticated user's most recent budget entries.
budgetRouter.get(
  "/",
  withCurrentUser(async (currentUser, request, response) => {
    const entries = await listBudgetEntriesForUser(
      currentUser.id,
      MAX_ENTRIES_RETURNED,
    );

    response.status(200).json({
      entries,
    });
  }),
);

// Creates a budget entry owned by the authenticated user.
budgetRouter.post(
  "/",
  withCurrentUser(async (currentUser, request, response) => {
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
  }),
);

// Deletes a budget entry only when it belongs to the authenticated user.
budgetRouter.delete(
  "/:entryId",
  withCurrentUser(async (currentUser, request, response) => {
    const entryId = parseRouteParam(response, entryIdSchema, request.params.entryId, "budget entry ID");

    if (!entryId) {
      return;
    }

    const deleted = await deleteBudgetEntryForUser(
      entryId,
      currentUser.id,
    );

    if (!deleted) {
      respondNotFound(response, "Budget entry");
      return;
    }

    response.status(204).send();
  }),
);
