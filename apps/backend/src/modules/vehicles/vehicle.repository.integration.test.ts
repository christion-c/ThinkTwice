import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import {
  createTestUser,
  deleteTestUser,
  ensureSchemaReady,
} from "../../test-support/db-test-helpers.js";
import {
  createVehicle,
  deleteVehicleForUser,
  listVehiclesForUser,
  updateVehicleForUser,
} from "./vehicle.repository.js";

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

test("createVehicle then listVehiclesForUser returns the created vehicle", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const created = await createVehicle({
    userId,
    nickname: "Daily Driver",
    make: "Toyota",
    model: "Corolla",
    modelYear: 2022,
    tankCapacityGallons: 13.5,
    combinedMpg: 32,
  });

  const vehicles = await listVehiclesForUser(userId);

  assert.equal(vehicles.length, 1);
  assert.equal(vehicles[0]?.id, created.id);
  assert.equal(vehicles[0]?.nickname, "Daily Driver");
  assert.equal(vehicles[0]?.combinedMpg, 32);
});

test("updateVehicleForUser only updates provided fields", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const created = await createVehicle({
    userId,
    nickname: "Weekend Car",
    make: "Honda",
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  const updated = await updateVehicleForUser({
    vehicleId: created.id,
    userId,
    nickname: "Weekend Cruiser",
  });

  assert.equal(updated?.nickname, "Weekend Cruiser");
  assert.equal(updated?.make, "Honda");
});

test("a user cannot update or delete another user's vehicle", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const created = await createVehicle({
    userId,
    nickname: "Owned By User",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  const updateAttempt = await updateVehicleForUser({
    vehicleId: created.id,
    userId: otherUserId,
    nickname: "Hijacked",
  });

  assert.equal(updateAttempt, null);

  const deleteAttempt = await deleteVehicleForUser(created.id, otherUserId);

  assert.equal(deleteAttempt, false);

  const stillOwnedByUser = await listVehiclesForUser(userId);

  assert.ok(stillOwnedByUser.some((vehicle) => vehicle.id === created.id));
});
