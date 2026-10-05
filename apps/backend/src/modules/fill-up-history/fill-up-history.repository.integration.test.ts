import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { database } from "../../db/pool.js";
import {
  createTestUser,
  deleteTestUser,
  ensureSchemaReady,
} from "../../test-support/db-test-helpers.js";
import { createVehicle } from "../vehicles/vehicles.repository.js";
import {
  deleteAllFillUpHistoryForUser,
  deleteFillUpHistoryEntry,
  insertFillUpHistory,
  listFillUpHistoryByFirebaseUid,
  listFillUpHistoryByUserId,
  updateFillUpHistoryVehicle,
} from "./fill-up-history.repository.js";

let dbAvailable = false;
let userId = "";
let userFirebaseUid = "";
let otherUserId = "";

before(async () => {
  dbAvailable = await ensureSchemaReady();

  if (dbAvailable) {
    userId = await createTestUser();
    otherUserId = await createTestUser();

    const row = await database.query<{ firebase_uid: string }>(
      "SELECT firebase_uid FROM users WHERE id = $1",
      [userId],
    );
    userFirebaseUid = row.rows[0]?.firebase_uid ?? "";
  }
});

after(async () => {
  if (dbAvailable) {
    await deleteTestUser(userId);
    await deleteTestUser(otherUserId);
  }
});

test("insertFillUpHistory then listFillUpHistoryByUserId returns the entry, newest first", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await insertFillUpHistory(userId, {
    milesDriven: 150,
    fuelPrice: 3.5,
    combinedMpg: 30,
    tankCapacity: 14,
    gallons: 5,
    observedCost: 17.5,
    recordedAt: "2026-01-01T00:00:00Z",
  });

  await insertFillUpHistory(userId, {
    milesDriven: 200,
    fuelPrice: 3.6,
    combinedMpg: 31,
    tankCapacity: 14,
    gallons: 6,
    observedCost: 21.6,
    recordedAt: "2026-02-01T00:00:00Z",
  });

  const entries = await listFillUpHistoryByUserId(userId);

  assert.equal(entries.length, 2);
  // Newest first: the February entry should come before the January one.
  assert.equal(entries[0]?.gallons, 6);
  assert.equal(entries[1]?.gallons, 5);
});

test("insertFillUpHistory defaults recordedAt to now when not provided", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const before = Date.now();

  await insertFillUpHistory(userId, {
    milesDriven: 100,
    fuelPrice: 3.0,
    combinedMpg: 28,
    tankCapacity: 12,
    gallons: 4,
    observedCost: 12,
  });

  const entries = await listFillUpHistoryByUserId(userId);
  const created = entries.find((entry) => entry.gallons === 4);

  assert.ok(created);
  assert.ok(created.recordedAt.getTime() >= before);
});

test("listFillUpHistoryByUserId does not leak another user's fill-up history", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await insertFillUpHistory(otherUserId, {
    milesDriven: 999,
    fuelPrice: 9.99,
    combinedMpg: 10,
    tankCapacity: 10,
    gallons: 9,
    observedCost: 90,
  });

  const ownEntries = await listFillUpHistoryByUserId(userId);

  assert.ok(!ownEntries.some((entry) => entry.gallons === 9));
});

test("listFillUpHistoryByFirebaseUid returns only the matching user's history", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await insertFillUpHistory(userId, {
    milesDriven: 175,
    fuelPrice: 3.75,
    combinedMpg: 29,
    tankCapacity: 13,
    gallons: 6.2,
    observedCost: 23.25,
  });

  const entries = await listFillUpHistoryByFirebaseUid(userFirebaseUid);

  assert.ok(entries.length > 0);
  assert.ok(entries.every((entry) => Number.isFinite(entry.gallons)));
  assert.ok(entries.some((entry) => entry.gallons === 6.2));
  // otherUserId's entry from the previous test must not appear here.
  assert.ok(!entries.some((entry) => entry.gallons === 9));
});

test("listFillUpHistoryByFirebaseUid returns an empty list for an unknown Firebase UID", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const entries = await listFillUpHistoryByFirebaseUid(
    "firebase-uid-that-does-not-exist",
  );

  assert.deepEqual(entries, []);
});

test("listFillUpHistoryByUserId returns each entry's id and defaults vehicleId to null", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await insertFillUpHistory(userId, {
    milesDriven: 50,
    fuelPrice: 3.2,
    combinedMpg: 26,
    tankCapacity: 12,
    gallons: 5.5,
    observedCost: 17.6,
  });

  const entries = await listFillUpHistoryByUserId(userId);
  const created = entries.find((entry) => entry.gallons === 5.5);

  assert.ok(created);
  assert.equal(typeof created.id, "string");
  assert.ok(created.id.length > 0);
  assert.equal(created.vehicleId, null);
});

test("insertFillUpHistory accepts an explicit vehicleId", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const vehicle = await createVehicle({
    userId,
    nickname: "Test Truck",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  await insertFillUpHistory(userId, {
    milesDriven: 60,
    fuelPrice: 3.3,
    combinedMpg: 24,
    tankCapacity: 15,
    gallons: 6.6,
    observedCost: 21.78,
    vehicleId: vehicle.id,
  });

  const entries = await listFillUpHistoryByUserId(userId);
  const created = entries.find((entry) => entry.gallons === 6.6);

  assert.ok(created);
  assert.equal(created.vehicleId, vehicle.id);
});

test("updateFillUpHistoryVehicle reassigns an entry to another vehicle owned by the same user", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const vehicle = await createVehicle({
    userId,
    nickname: "Reassign Target",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  await insertFillUpHistory(userId, {
    milesDriven: 70,
    fuelPrice: 3.1,
    combinedMpg: 27,
    tankCapacity: 13,
    gallons: 7.7,
    observedCost: 23.87,
  });

  const entries = await listFillUpHistoryByUserId(userId);
  const target = entries.find((entry) => entry.gallons === 7.7);
  assert.ok(target);

  const updated = await updateFillUpHistoryVehicle(
    target.id,
    userId,
    vehicle.id,
  );

  assert.ok(updated);
  assert.equal(updated.vehicleId, vehicle.id);
});

test("updateFillUpHistoryVehicle unassigns an entry when given null", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const vehicle = await createVehicle({
    userId,
    nickname: "Unassign Source",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  await insertFillUpHistory(userId, {
    milesDriven: 80,
    fuelPrice: 3.0,
    combinedMpg: 25,
    tankCapacity: 11,
    gallons: 8.8,
    observedCost: 26.4,
    vehicleId: vehicle.id,
  });

  const entries = await listFillUpHistoryByUserId(userId);
  const target = entries.find((entry) => entry.gallons === 8.8);
  assert.ok(target);

  const updated = await updateFillUpHistoryVehicle(target.id, userId, null);

  assert.ok(updated);
  assert.equal(updated.vehicleId, null);
});

test("updateFillUpHistoryVehicle refuses to assign a vehicle owned by a different user", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const othersVehicle = await createVehicle({
    userId: otherUserId,
    nickname: "Not Yours",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  await insertFillUpHistory(userId, {
    milesDriven: 90,
    fuelPrice: 3.4,
    combinedMpg: 23,
    tankCapacity: 16,
    gallons: 9.9,
    observedCost: 33.66,
  });

  const entries = await listFillUpHistoryByUserId(userId);
  const target = entries.find((entry) => entry.gallons === 9.9);
  assert.ok(target);

  const result = await updateFillUpHistoryVehicle(
    target.id,
    userId,
    othersVehicle.id,
  );

  // Neither the entry nor the target vehicle belong to the same user
  // together, so this must refuse (null), not silently succeed.
  assert.equal(result, null);

  const unchanged = await listFillUpHistoryByUserId(userId);
  assert.equal(
    unchanged.find((entry) => entry.id === target.id)?.vehicleId,
    null,
  );
});

test("updateFillUpHistoryVehicle returns null for an entry owned by a different user", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await insertFillUpHistory(otherUserId, {
    milesDriven: 15,
    fuelPrice: 3.0,
    combinedMpg: 22,
    tankCapacity: 10,
    gallons: 1.5,
    observedCost: 4.5,
  });

  const othersEntries = await listFillUpHistoryByUserId(otherUserId);
  const othersEntry = othersEntries.find((entry) => entry.gallons === 1.5);
  assert.ok(othersEntry);

  const result = await updateFillUpHistoryVehicle(othersEntry.id, userId, null);

  assert.equal(result, null);
});

test("deleteFillUpHistoryEntry removes only the entry owned by the given user", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await insertFillUpHistory(userId, {
    milesDriven: 25,
    fuelPrice: 3.1,
    combinedMpg: 24,
    tankCapacity: 12,
    gallons: 2.5,
    observedCost: 7.75,
  });

  const entries = await listFillUpHistoryByUserId(userId);
  const target = entries.find((entry) => entry.gallons === 2.5);
  assert.ok(target);

  const deleted = await deleteFillUpHistoryEntry(target.id, userId);
  assert.equal(deleted, true);

  const remaining = await listFillUpHistoryByUserId(userId);
  assert.ok(!remaining.some((entry) => entry.id === target.id));
});

test("deleteFillUpHistoryEntry refuses to delete another user's entry", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await insertFillUpHistory(otherUserId, {
    milesDriven: 35,
    fuelPrice: 3.2,
    combinedMpg: 21,
    tankCapacity: 14,
    gallons: 3.5,
    observedCost: 11.2,
  });

  const othersEntries = await listFillUpHistoryByUserId(otherUserId);
  const othersEntry = othersEntries.find((entry) => entry.gallons === 3.5);
  assert.ok(othersEntry);

  const deleted = await deleteFillUpHistoryEntry(othersEntry.id, userId);
  assert.equal(deleted, false);

  const stillThere = await listFillUpHistoryByUserId(otherUserId);
  assert.ok(stillThere.some((entry) => entry.id === othersEntry.id));
});

test("deleteAllFillUpHistoryForUser removes every entry for that user and none of another's", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const bulkUserId = await createTestUser();
  const untouchedUserId = await createTestUser();

  try {
    await insertFillUpHistory(bulkUserId, {
      milesDriven: 10,
      fuelPrice: 3.0,
      combinedMpg: 20,
      tankCapacity: 10,
      gallons: 1,
      observedCost: 3,
    });
    await insertFillUpHistory(bulkUserId, {
      milesDriven: 20,
      fuelPrice: 3.0,
      combinedMpg: 20,
      tankCapacity: 10,
      gallons: 2,
      observedCost: 6,
    });
    await insertFillUpHistory(untouchedUserId, {
      milesDriven: 30,
      fuelPrice: 3.0,
      combinedMpg: 20,
      tankCapacity: 10,
      gallons: 3,
      observedCost: 9,
    });

    const deletedCount = await deleteAllFillUpHistoryForUser(bulkUserId);
    assert.equal(deletedCount, 2);

    const remaining = await listFillUpHistoryByUserId(bulkUserId);
    assert.deepEqual(remaining, []);

    const untouched = await listFillUpHistoryByUserId(untouchedUserId);
    assert.equal(untouched.length, 1);
  } finally {
    await deleteTestUser(bulkUserId);
    await deleteTestUser(untouchedUserId);
  }
});

test("insertFillUpHistory accepts the user's own vehicle", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const vehicle = await createVehicle({
    userId,
    nickname: "Own Insert Vehicle",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  const saved = await insertFillUpHistory(userId, {
    milesDriven: 120,
    fuelPrice: 3.4,
    combinedMpg: 29,
    tankCapacity: 13,
    gallons: 4.25,
    observedCost: 14.45,
    vehicleId: vehicle.id,
  });

  assert.equal(saved, true);
  const entries = await listFillUpHistoryByUserId(userId);
  assert.ok(
    entries.some(
      (entry) => entry.vehicleId === vehicle.id && entry.gallons === 4.25,
    ),
  );
});

test("insertFillUpHistory refuses a vehicle owned by a different user", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const othersVehicle = await createVehicle({
    userId: otherUserId,
    nickname: "Not Yours Insert",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  const saved = await insertFillUpHistory(userId, {
    milesDriven: 1,
    fuelPrice: 1,
    combinedMpg: 1,
    tankCapacity: 1,
    gallons: 7.7777,
    observedCost: 1,
    vehicleId: othersVehicle.id,
  });

  assert.equal(saved, false);
  const entries = await listFillUpHistoryByUserId(userId);
  assert.ok(!entries.some((entry) => entry.gallons === 7.7777));
});
