import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import {
  createTestUser,
  deleteTestUser,
  ensureSchemaReady,
} from "../../test-support/db-test-helpers.js";
import {
  createBudgetEntry,
  deleteBudgetEntryForUser,
  listBudgetEntriesForUser,
} from "./budget.repository.js";

let dbAvailable = false;
let userId = "";
let otherUserId = "";

before(async () => {
  dbAvailable = await ensureSchemaReady();

  if (dbAvailable) {
    userId = await createTestUser();
    otherUserId = await createTestUser();
  }
});

after(async () => {
  if (dbAvailable) {
    // ON DELETE CASCADE removes each user's budget entries too.
    await deleteTestUser(userId);
    await deleteTestUser(otherUserId);
  }
});

test("createBudgetEntry then listBudgetEntriesForUser returns newest first", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await createBudgetEntry({
    userId,
    entryDate: "2026-08-01",
    fuelCost: 60,
    foodCost: 20,
    milesDriven: 150,
    meals: 14,
  });

  await createBudgetEntry({
    userId,
    entryDate: "2026-08-08",
    fuelCost: 65,
    foodCost: 16,
    milesDriven: 160,
    meals: 15,
  });

  const entries = await listBudgetEntriesForUser(userId, 10);

  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.entryDate, "2026-08-08");
  assert.equal(entries[0]?.fuelCost, 65);
  assert.equal(entries[1]?.entryDate, "2026-08-01");
});

test("listBudgetEntriesForUser respects the limit", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const entries = await listBudgetEntriesForUser(userId, 1);

  assert.equal(entries.length, 1);
});

test("a user cannot delete another user's budget entry", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const created = await createBudgetEntry({
    userId,
    entryDate: "2026-08-09",
    fuelCost: 40,
    foodCost: 12,
    milesDriven: 90,
    meals: 6,
  });

  const deletedByOtherUser = await deleteBudgetEntryForUser(
    created.id,
    otherUserId,
  );

  assert.equal(deletedByOtherUser, false);

  const deletedByOwner = await deleteBudgetEntryForUser(created.id, userId);

  assert.equal(deletedByOwner, true);
});
