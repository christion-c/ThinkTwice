import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import {
  createTestUser,
  deleteTestUser,
  ensureSchemaReady,
} from "../../test-support/db-test-helpers.js";
import { createVehicle } from "../vehicles/vehicles.repository.js";
import {
  deleteAllDailyDrivingLogsForUser,
  deleteDailyDrivingLog,
  listDailyDrivingLogsForUser,
  updateDailyDrivingLogVehicle,
  upsertDailyDrivingLog,
  type DailyDrivingLog,
} from "./daily-driving-log.repository.js";

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

// upsertDailyDrivingLog returns null only when vehicleId names someone
// else's vehicle; the tests that never pass one use this to get a
// non-null log back.
async function upsertOwnLog(
  ownerId: string,
  input: Parameters<typeof upsertDailyDrivingLog>[1],
): Promise<DailyDrivingLog> {
  const log = await upsertDailyDrivingLog(ownerId, input);
  assert.ok(log, "expected the log to be written");
  return log;
}

test("upsertDailyDrivingLog then listDailyDrivingLogsForUser returns the log, newest first", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await upsertDailyDrivingLog(userId, { logDate: "2026-01-01", milesDriven: 20 });
  await upsertDailyDrivingLog(userId, { logDate: "2026-01-02", milesDriven: 35 });

  const logs = await listDailyDrivingLogsForUser(userId);

  assert.equal(logs.length, 2);
  // Newest first: Jan 2 should come before Jan 1.
  assert.equal(logs[0]?.logDate, "2026-01-02");
  assert.equal(logs[0]?.milesDriven, 35);
  assert.equal(logs[1]?.logDate, "2026-01-01");
});

test("upsertDailyDrivingLog on the same day corrects the existing log instead of duplicating it", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await upsertDailyDrivingLog(userId, { logDate: "2026-03-05", milesDriven: 10 });
  await upsertDailyDrivingLog(userId, { logDate: "2026-03-05", milesDriven: 42 });

  const logs = await listDailyDrivingLogsForUser(userId);
  const matching = logs.filter((log) => log.logDate === "2026-03-05");

  assert.equal(matching.length, 1);
  assert.equal(matching[0]?.milesDriven, 42);
});

test("listDailyDrivingLogsForUser does not leak another user's logs", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  await upsertDailyDrivingLog(otherUserId, { logDate: "2026-04-01", milesDriven: 999 });

  const ownLogs = await listDailyDrivingLogsForUser(userId);

  assert.ok(!ownLogs.some((log) => log.milesDriven === 999));
});

test("upsertDailyDrivingLog returns an id and defaults vehicleId to null", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const log = await upsertOwnLog(userId, { logDate: "2026-05-01", milesDriven: 12 });

  assert.equal(typeof log.id, "string");
  assert.ok(log.id.length > 0);
  assert.equal(log.vehicleId, null);
});

test("upsertDailyDrivingLog accepts an explicit vehicleId and updates it on re-checkin", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const vehicle = await createVehicle({
    userId,
    nickname: "Daily Log Vehicle",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  const created = await upsertOwnLog(userId, {
    logDate: "2026-05-02",
    milesDriven: 14,
    vehicleId: vehicle.id,
  });
  assert.equal(created.vehicleId, vehicle.id);

  // Re-checking in on the same day without a vehicleId should clear it,
  // since the upsert's SET clause always writes vehicle_id = EXCLUDED.
  const corrected = await upsertOwnLog(userId, {
    logDate: "2026-05-02",
    milesDriven: 16,
  });
  assert.equal(corrected.vehicleId, null);
});

test("updateDailyDrivingLogVehicle reassigns a log to another vehicle owned by the same user", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const vehicle = await createVehicle({
    userId,
    nickname: "Reassign Target Log",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  const log = await upsertOwnLog(userId, { logDate: "2026-05-03", milesDriven: 18 });

  const updated = await updateDailyDrivingLogVehicle(log.id, userId, vehicle.id);

  assert.ok(updated);
  assert.equal(updated.vehicleId, vehicle.id);
});

test("updateDailyDrivingLogVehicle refuses to assign a vehicle owned by a different user", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const othersVehicle = await createVehicle({
    userId: otherUserId,
    nickname: "Not Yours Log",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  const log = await upsertOwnLog(userId, { logDate: "2026-05-04", milesDriven: 22 });

  const result = await updateDailyDrivingLogVehicle(log.id, userId, othersVehicle.id);

  assert.equal(result, null);
});

test("deleteDailyDrivingLog removes only the log owned by the given user", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const log = await upsertOwnLog(userId, { logDate: "2026-05-05", milesDriven: 24 });

  const deleted = await deleteDailyDrivingLog(log.id, userId);
  assert.equal(deleted, true);

  const remaining = await listDailyDrivingLogsForUser(userId);
  assert.ok(!remaining.some((entry) => entry.id === log.id));
});

test("deleteDailyDrivingLog refuses to delete another user's log", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const othersLog = await upsertOwnLog(otherUserId, {
    logDate: "2026-05-06",
    milesDriven: 26,
  });

  const deleted = await deleteDailyDrivingLog(othersLog.id, userId);
  assert.equal(deleted, false);

  const stillThere = await listDailyDrivingLogsForUser(otherUserId);
  assert.ok(stillThere.some((entry) => entry.id === othersLog.id));
});

test("deleteAllDailyDrivingLogsForUser removes every log for that user and none of another's", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const bulkUserId = await createTestUser();
  const untouchedUserId = await createTestUser();

  try {
    await upsertDailyDrivingLog(bulkUserId, { logDate: "2026-06-01", milesDriven: 5 });
    await upsertDailyDrivingLog(bulkUserId, { logDate: "2026-06-02", milesDriven: 6 });
    await upsertDailyDrivingLog(untouchedUserId, { logDate: "2026-06-01", milesDriven: 7 });

    const deletedCount = await deleteAllDailyDrivingLogsForUser(bulkUserId);
    assert.equal(deletedCount, 2);

    const remaining = await listDailyDrivingLogsForUser(bulkUserId);
    assert.deepEqual(remaining, []);

    const untouched = await listDailyDrivingLogsForUser(untouchedUserId);
    assert.equal(untouched.length, 1);
  } finally {
    await deleteTestUser(bulkUserId);
    await deleteTestUser(untouchedUserId);
  }
});

test("upsertDailyDrivingLog refuses a vehicle owned by a different user", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const othersVehicle = await createVehicle({
    userId: otherUserId,
    nickname: "Not Yours Upsert",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  const result = await upsertDailyDrivingLog(userId, {
    logDate: "2026-07-01",
    milesDriven: 30,
    vehicleId: othersVehicle.id,
  });

  assert.equal(result, null);
  const logs = await listDailyDrivingLogsForUser(userId);
  assert.ok(!logs.some((log) => log.logDate === "2026-07-01"));
});

test("upsertDailyDrivingLog with another user's vehicle leaves an existing log for that day untouched", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const othersVehicle = await createVehicle({
    userId: otherUserId,
    nickname: "Not Yours Conflict",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  await upsertOwnLog(userId, { logDate: "2026-07-02", milesDriven: 11 });

  const result = await upsertDailyDrivingLog(userId, {
    logDate: "2026-07-02",
    milesDriven: 99,
    vehicleId: othersVehicle.id,
  });

  assert.equal(result, null);
  const logs = await listDailyDrivingLogsForUser(userId);
  const day = logs.find((log) => log.logDate === "2026-07-02");
  assert.equal(day?.milesDriven, 11);
  assert.equal(day?.vehicleId, null);
});
