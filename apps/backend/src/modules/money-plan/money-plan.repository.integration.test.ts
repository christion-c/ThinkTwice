import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import {
  createTestUser,
  deleteTestUser,
  ensureSchemaReady,
} from "../../test-support/db-test-helpers.js";
import {
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
    await deleteTestUser(userId);
    await deleteTestUser(otherUserId);
  }
});

const debt: MoneyItemInput = {
  kind: "loan",
  name: "School loan",
  monthlyAmount: 250.5,
  balance: 9000.25,
  balanceAsOf: "2026-10-02",
  aprPercent: 4.5,
  startsOn: "2027-01-01",
  fromPaycheck: false,
};

test("getPayProfileForUser returns null before setup, then the saved profile", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  assert.equal(await getPayProfileForUser(userId), null);

  await upsertPayProfileForUser(userId, {
    hourlyRate: 18.5,
    hoursPerWeek: 40,
    payFrequency: "weekly",
    takeHomePerCheck: 600,
  });
  const updated = await upsertPayProfileForUser(userId, {
    hourlyRate: 19.25,
    hoursPerWeek: 32.5,
    payFrequency: "biweekly",
    takeHomePerCheck: 1012.34,
  });

  assert.deepEqual(updated, {
    hourlyRate: 19.25,
    hoursPerWeek: 32.5,
    payFrequency: "biweekly",
    takeHomePerCheck: 1012.34,
  });
  assert.deepEqual(await getPayProfileForUser(userId), updated);
  assert.equal(await getPayProfileForUser(otherUserId), null);
});

test("createMoneyItem round-trips every field exactly, dates as YYYY-MM-DD", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const created = await createMoneyItem(userId, debt);
  const { id, ...fields } = created;

  assert.equal(typeof id, "string");
  assert.deepEqual(fields, debt);

  const listed = await listMoneyItemsForUser(userId);
  assert.ok(
    listed.some(
      (item) =>
        item.id === id &&
        item.balance === 9000.25 &&
        item.startsOn === "2027-01-01",
    ),
  );
});

test("listMoneyItemsForUser never returns another user's items", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const theirs = await createMoneyItem(otherUserId, {
    ...debt,
    name: "Their loan",
  });

  const mine = await listMoneyItemsForUser(userId);
  assert.ok(!mine.some((item) => item.id === theirs.id));
});

test("replaceMoneyItemForUser updates the owner's item but refuses another user's", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const mine = await createMoneyItem(userId, { ...debt, name: "Mine" });
  const theirs = await createMoneyItem(otherUserId, {
    ...debt,
    name: "Theirs",
  });

  const updated = await replaceMoneyItemForUser(mine.id, userId, {
    ...debt,
    name: "Renamed",
    balance: 8500,
  });
  assert.equal(updated?.name, "Renamed");
  assert.equal(updated?.balance, 8500);

  const refused = await replaceMoneyItemForUser(theirs.id, userId, {
    ...debt,
    name: "Hijacked",
  });
  assert.equal(refused, null);

  const theirsAfter = await listMoneyItemsForUser(otherUserId);
  assert.equal(
    theirsAfter.find((item) => item.id === theirs.id)?.name,
    "Theirs",
  );
});

test("deleteMoneyItemForUser deletes the owner's item but refuses another user's", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const mine = await createMoneyItem(userId, { ...debt, name: "Delete me" });
  const theirs = await createMoneyItem(otherUserId, {
    ...debt,
    name: "Keep me",
  });

  assert.equal(await deleteMoneyItemForUser(theirs.id, userId), false);
  assert.equal(await deleteMoneyItemForUser(mine.id, userId), true);

  assert.ok(
    !(await listMoneyItemsForUser(userId)).some((item) => item.id === mine.id),
  );
  assert.ok(
    (await listMoneyItemsForUser(otherUserId)).some(
      (item) => item.id === theirs.id,
    ),
  );
});

test("deleting the user removes their pay profile and items", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const throwaway = await createTestUser();
  await upsertPayProfileForUser(throwaway, {
    hourlyRate: 10,
    hoursPerWeek: 10,
    payFrequency: "monthly",
    takeHomePerCheck: 100,
  });
  await createMoneyItem(throwaway, { ...debt, name: "Gone soon" });

  await deleteTestUser(throwaway);

  assert.equal(await getPayProfileForUser(throwaway), null);
  assert.deepEqual(await listMoneyItemsForUser(throwaway), []);
});

test("paychecks round-trip exactly, list newest first, and stay with their owner", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const older = await createPaycheck(userId, {
    paidOn: "2026-09-19",
    takeHome: 598.12,
    gross: null,
  });
  const newer = await createPaycheck(userId, {
    paidOn: "2026-10-03",
    takeHome: 612.4,
    gross: 801.55,
  });
  const theirs = await createPaycheck(otherUserId, {
    paidOn: "2026-10-03",
    takeHome: 1,
    gross: null,
  });

  assert.deepEqual(newer, {
    id: newer.id,
    paidOn: "2026-10-03",
    takeHome: 612.4,
    gross: 801.55,
  });

  const mine = await listPaychecksForUser(userId);
  assert.deepEqual(
    mine
      .filter((check) => check.id === older.id || check.id === newer.id)
      .map((check) => check.id),
    [newer.id, older.id],
  );
  assert.ok(!mine.some((check) => check.id === theirs.id));

  const updated = await replacePaycheckForUser(older.id, userId, {
    paidOn: "2026-09-20",
    takeHome: 600,
    gross: 790,
  });
  assert.deepEqual(updated, {
    id: older.id,
    paidOn: "2026-09-20",
    takeHome: 600,
    gross: 790,
  });
  assert.equal(
    await replacePaycheckForUser(theirs.id, userId, {
      paidOn: "2026-10-03",
      takeHome: 5,
      gross: null,
    }),
    null,
  );

  assert.equal(await deletePaycheckForUser(theirs.id, userId), false);
  assert.equal(await deletePaycheckForUser(older.id, userId), true);
  assert.ok(
    (await listPaychecksForUser(otherUserId)).some(
      (check) => check.id === theirs.id && check.takeHome === 1,
    ),
  );
});

test("deleting the user removes their paychecks", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const throwaway = await createTestUser();
  await createPaycheck(throwaway, {
    paidOn: "2026-10-03",
    takeHome: 100,
    gross: null,
  });

  await deleteTestUser(throwaway);

  assert.deepEqual(await listPaychecksForUser(throwaway), []);
});
