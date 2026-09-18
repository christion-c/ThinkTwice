import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, test } from "node:test";

import {
  createTestUser,
  deleteTestUser,
  ensureSchemaReady,
} from "../../test-support/db-test-helpers.js";
import { createVehicle, listVehiclesForUser } from "../vehicles/vehicles.repository.js";
import { deleteUserById, upsertUserFromFirebase } from "./users.repository.js";

let dbAvailable = false;

before(async () => {
  dbAvailable = await ensureSchemaReady();
});

test("upsertUserFromFirebase creates a new user, then updates it on conflict", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const firebaseUid = `test-${randomUUID()}`;
  let createdId: string | undefined;

  try {
    const created = await upsertUserFromFirebase({
      firebaseUid,
      email: "person@example.test",
      displayName: "Person One",
      photoUrl: "https://example.test/photo.png",
      emailVerified: false,
    });
    createdId = created.id;

    assert.ok(created.id);
    assert.equal(created.firebaseUid, firebaseUid);
    assert.equal(created.email, "person@example.test");
    assert.equal(created.displayName, "Person One");
    assert.equal(created.photoUrl, "https://example.test/photo.png");
    assert.equal(created.emailVerified, false);
    assert.ok(created.createdAt instanceof Date);
    assert.ok(created.updatedAt instanceof Date);

    // Firebase account details changed (e.g. the user updated their
    // display name and verified their email) - same firebase_uid should
    // update the existing row rather than creating a second one.
    const updated = await upsertUserFromFirebase({
      firebaseUid,
      email: "person-updated@example.test",
      displayName: "Person One Updated",
      photoUrl: null,
      emailVerified: true,
    });

    assert.equal(updated.id, created.id);
    assert.equal(updated.firebaseUid, firebaseUid);
    assert.equal(updated.email, "person-updated@example.test");
    assert.equal(updated.displayName, "Person One Updated");
    assert.equal(updated.photoUrl, null);
    assert.equal(updated.emailVerified, true);
  } finally {
    if (createdId) {
      await deleteTestUser(createdId);
    }
  }
});

// The behavior that matters most here: account deletion is irreversible,
// so this confirms a related row (a vehicle) actually disappears via the
// ON DELETE CASCADE foreign keys, not just the users row itself.
test("deleteUserById removes the user and cascades to their vehicles", async (t) => {
  if (!dbAvailable) {
    t.skip("DATABASE_URL is not reachable; skipping integration test.");
    return;
  }

  const userId = await createTestUser();

  await createVehicle({
    userId,
    nickname: "Soon To Be Deleted",
    make: null,
    model: null,
    modelYear: null,
    tankCapacityGallons: null,
    combinedMpg: null,
  });

  await deleteUserById(userId);

  const remainingVehicles = await listVehiclesForUser(userId);
  assert.deepEqual(remainingVehicles, []);

  // No deleteTestUser cleanup here - the row this test created is
  // exactly what it just verified is already gone.
});
