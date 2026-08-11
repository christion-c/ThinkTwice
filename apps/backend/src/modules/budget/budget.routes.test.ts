import assert from "node:assert/strict";
import { test } from "node:test";

import { createBudgetEntrySchema } from "./budget.routes.js";

test("createBudgetEntrySchema accepts a full valid entry", () => {
  const result = createBudgetEntrySchema.safeParse({
    entryDate: "2026-08-11",
    fuelCost: 65,
    foodCost: 16,
    milesDriven: 42.5,
    meals: 3,
  });

  assert.equal(result.success, true);
});

test("createBudgetEntrySchema accepts an entry with only a date", () => {
  const result = createBudgetEntrySchema.safeParse({
    entryDate: "2026-08-11",
  });

  assert.equal(result.success, true);
});

test("createBudgetEntrySchema rejects a missing entryDate", () => {
  const result = createBudgetEntrySchema.safeParse({ fuelCost: 10 });

  assert.equal(result.success, false);
});

test("createBudgetEntrySchema rejects a malformed date", () => {
  const result = createBudgetEntrySchema.safeParse({
    entryDate: "08/11/2026",
  });

  assert.equal(result.success, false);
});

test("createBudgetEntrySchema rejects a negative cost", () => {
  const result = createBudgetEntrySchema.safeParse({
    entryDate: "2026-08-11",
    fuelCost: -5,
  });

  assert.equal(result.success, false);
});

test("createBudgetEntrySchema rejects a non-integer meal count", () => {
  const result = createBudgetEntrySchema.safeParse({
    entryDate: "2026-08-11",
    meals: 2.5,
  });

  assert.equal(result.success, false);
});

test("createBudgetEntrySchema rejects unknown fields", () => {
  const result = createBudgetEntrySchema.safeParse({
    entryDate: "2026-08-11",
    notes: "grocery run",
  });

  assert.equal(result.success, false);
});
