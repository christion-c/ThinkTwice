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
  countMoneyItemsForUser,
  countPaychecksForUser,
  createMoneyItem,
  createPaycheck,
  deleteMoneyItemForUser,
  deletePaycheckForUser,
  getPayProfileForUser,
  listMoneyItemsForUser,
  listPaychecksForUser,
  type MoneyItemInput,
  replaceMoneyItemForUser,
  replacePaycheckForUser,
  upsertPayProfileForUser,
} from "./money-plan.repository.js";

export const moneyPlanRouter = Router();

// Generous for any real budget, but bounds what one account can store.
export const MAX_MONEY_ITEMS_PER_USER = 200;
// About 20 years of weekly checks.
export const MAX_PAYCHECKS_PER_USER = 1_000;

// Cents precision, matching the NUMERIC columns.
const money = (max: number) =>
  z
    .number()
    .min(0)
    .max(max)
    // Tolerance absorbs binary float noise (e.g. 0.29 * 100 = 28.999...).
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, {
      message: "Must have at most 2 decimal places",
    });

const itemName = z.string().trim().min(1).max(60);
const isoDate = z.iso.date();
// The 1st of a month (YYYY-MM-01) - a debt's first payment month.
const monthStart = z.iso.date().refine((value) => value.endsWith("-01"), {
  message: "Must be the first day of a month",
});

export const payProfileSchema = z
  .object({
    hourlyRate: money(10_000),
    hoursPerWeek: z.number().min(0).max(168),
    payFrequency: z.enum(["weekly", "biweekly", "semimonthly", "monthly"]),
    takeHomePerCheck: money(1_000_000),
  })
  .strict();

const billSchema = z
  .object({
    kind: z.literal("bill"),
    name: itemName,
    monthlyAmount: money(1_000_000),
  })
  .strict();

const debtSchema = z
  .object({
    kind: z.enum(["loan", "card", "collection"]),
    name: itemName,
    monthlyAmount: money(1_000_000),
    balance: money(100_000_000),
    balanceAsOf: isoDate,
    aprPercent: z.number().min(0).max(100).nullable().optional(),
    startsOn: monthStart.nullable().optional(),
    fromPaycheck: z.boolean().optional(),
  })
  .strict();

const assetSchema = z
  .object({
    kind: z.literal("asset"),
    name: itemName,
    balance: money(100_000_000),
    balanceAsOf: isoDate,
  })
  .strict();

export const moneyItemSchema = z.union([billSchema, debtSchema, assetSchema]);

export const paycheckSchema = z
  .object({
    paidOn: isoDate,
    takeHome: money(1_000_000),
    gross: money(1_000_000).nullable().optional(),
  })
  .strict();

const itemIdSchema = z.uuid();

// Normalizes any valid item body into the full row shape, nulling out
// the fields that don't apply to its kind.
function toItemInput(body: z.infer<typeof moneyItemSchema>): MoneyItemInput {
  if (body.kind === "bill") {
    return {
      kind: "bill",
      name: body.name,
      monthlyAmount: body.monthlyAmount,
      balance: null,
      balanceAsOf: null,
      aprPercent: null,
      startsOn: null,
      fromPaycheck: false,
    };
  }

  if (body.kind === "asset") {
    return {
      kind: "asset",
      name: body.name,
      monthlyAmount: 0,
      balance: body.balance,
      balanceAsOf: body.balanceAsOf,
      aprPercent: null,
      startsOn: null,
      fromPaycheck: false,
    };
  }

  return {
    kind: body.kind,
    name: body.name,
    monthlyAmount: body.monthlyAmount,
    balance: body.balance,
    balanceAsOf: body.balanceAsOf,
    aprPercent: body.aprPercent ?? null,
    startsOn: body.startsOn ?? null,
    fromPaycheck: body.fromPaycheck ?? false,
  };
}

// Every route below requires a verified, synced user.
moneyPlanRouter.use(requireAuth, syncCurrentUser);

// Returns the user's whole money plan in one request.
moneyPlanRouter.get(
  "/",
  withCurrentUser(async (currentUser, request, response) => {
    const [pay, items, paychecks] = await Promise.all([
      getPayProfileForUser(currentUser.id),
      listMoneyItemsForUser(currentUser.id),
      listPaychecksForUser(currentUser.id),
    ]);

    response.status(200).json({ pay, items, paychecks });
  }),
);

// Creates or replaces the user's pay profile.
moneyPlanRouter.put(
  "/pay",
  withCurrentUser(async (currentUser, request, response) => {
    const result = payProfileSchema.safeParse(request.body);

    if (!result.success) {
      respondWithValidationError(response, result.error, "Invalid pay details");
      return;
    }

    const pay = await upsertPayProfileForUser(currentUser.id, result.data);
    response.status(200).json({ pay });
  }),
);

// Adds a bill, debt, or asset owned by the user.
moneyPlanRouter.post(
  "/items",
  withCurrentUser(async (currentUser, request, response) => {
    const result = moneyItemSchema.safeParse(request.body);

    if (!result.success) {
      respondWithValidationError(response, result.error, "Invalid item");
      return;
    }

    if (
      (await countMoneyItemsForUser(currentUser.id)) >= MAX_MONEY_ITEMS_PER_USER
    ) {
      response.status(409).json({
        error: `You can have up to ${MAX_MONEY_ITEMS_PER_USER} items`,
      });
      return;
    }

    const item = await createMoneyItem(
      currentUser.id,
      toItemInput(result.data),
    );
    response.status(201).json({ item });
  }),
);

// Replaces an item's fields - only when it belongs to the user.
moneyPlanRouter.put(
  "/items/:itemId",
  withCurrentUser(async (currentUser, request, response) => {
    const itemId = parseRouteParam(
      response,
      itemIdSchema,
      request.params.itemId,
      "item ID",
    );

    if (!itemId) {
      return;
    }

    const result = moneyItemSchema.safeParse(request.body);

    if (!result.success) {
      respondWithValidationError(response, result.error, "Invalid item");
      return;
    }

    const item = await replaceMoneyItemForUser(
      itemId,
      currentUser.id,
      toItemInput(result.data),
    );

    if (!item) {
      respondNotFound(response, "Item");
      return;
    }

    response.status(200).json({ item });
  }),
);

// Deletes an item - only when it belongs to the user.
moneyPlanRouter.delete(
  "/items/:itemId",
  withCurrentUser(async (currentUser, request, response) => {
    const itemId = parseRouteParam(
      response,
      itemIdSchema,
      request.params.itemId,
      "item ID",
    );

    if (!itemId) {
      return;
    }

    const deleted = await deleteMoneyItemForUser(itemId, currentUser.id);

    if (!deleted) {
      respondNotFound(response, "Item");
      return;
    }

    response.status(204).send();
  }),
);

// Logs a paycheck as actually received.
moneyPlanRouter.post(
  "/paychecks",
  withCurrentUser(async (currentUser, request, response) => {
    const result = paycheckSchema.safeParse(request.body);

    if (!result.success) {
      respondWithValidationError(response, result.error, "Invalid paycheck");
      return;
    }

    if (
      (await countPaychecksForUser(currentUser.id)) >= MAX_PAYCHECKS_PER_USER
    ) {
      response.status(409).json({
        error: `You can log up to ${MAX_PAYCHECKS_PER_USER} paychecks`,
      });
      return;
    }

    const paycheck = await createPaycheck(currentUser.id, {
      paidOn: result.data.paidOn,
      takeHome: result.data.takeHome,
      gross: result.data.gross ?? null,
    });
    response.status(201).json({ paycheck });
  }),
);

// Replaces a paycheck's fields - only when it belongs to the user.
moneyPlanRouter.put(
  "/paychecks/:paycheckId",
  withCurrentUser(async (currentUser, request, response) => {
    const paycheckId = parseRouteParam(
      response,
      itemIdSchema,
      request.params.paycheckId,
      "paycheck ID",
    );

    if (!paycheckId) {
      return;
    }

    const result = paycheckSchema.safeParse(request.body);

    if (!result.success) {
      respondWithValidationError(response, result.error, "Invalid paycheck");
      return;
    }

    const paycheck = await replacePaycheckForUser(paycheckId, currentUser.id, {
      paidOn: result.data.paidOn,
      takeHome: result.data.takeHome,
      gross: result.data.gross ?? null,
    });

    if (!paycheck) {
      respondNotFound(response, "Paycheck");
      return;
    }

    response.status(200).json({ paycheck });
  }),
);

// Deletes a paycheck - only when it belongs to the user.
moneyPlanRouter.delete(
  "/paychecks/:paycheckId",
  withCurrentUser(async (currentUser, request, response) => {
    const paycheckId = parseRouteParam(
      response,
      itemIdSchema,
      request.params.paycheckId,
      "paycheck ID",
    );

    if (!paycheckId) {
      return;
    }

    const deleted = await deletePaycheckForUser(paycheckId, currentUser.id);

    if (!deleted) {
      respondNotFound(response, "Paycheck");
      return;
    }

    response.status(204).send();
  }),
);
