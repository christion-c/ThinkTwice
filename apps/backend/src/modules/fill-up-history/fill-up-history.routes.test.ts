import test from "node:test";
import assert from "node:assert/strict";

import { entrySchema } from "./fill-up-history.routes.js";

test("entrySchema accepts an explicit fill-up date", () => {
  const result = entrySchema.safeParse({
    milesDriven: 150,
    fuelPrice: 3.89,
    combinedMpg: 30,
    tankCapacity: 14,
    gallons: 12.4,
    observedCost: 48.14,
    recordedAt: "2026-08-12T08:30:00-05:00",
  });

  assert.equal(result.success, true);
});

test("entrySchema rejects an invalid fill-up date", () => {
  const result = entrySchema.safeParse({
    milesDriven: 150,
    fuelPrice: 3.89,
    combinedMpg: 30,
    tankCapacity: 14,
    gallons: 12.4,
    observedCost: 48.14,
    recordedAt: "not-a-date",
  });

  assert.equal(result.success, false);
});
