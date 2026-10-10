import test from "node:test";
import assert from "node:assert/strict";
import { after, before } from "node:test";
import type { AddressInfo } from "node:net";

import { createApp } from "../../app.js";
import {
  entrySchema,
  reassignVehicleSchema,
} from "./fill-up-history.routes.js";

// Matches the default the test script exports (see package.json's
// "test" script) before env.ts is ever imported.
const CORRECT_INTERNAL_TOKEN = "test-only-internal-token";

let baseUrl = "";
let server: ReturnType<ReturnType<typeof createApp>["listen"]>;

before(async () => {
  const app = createApp();

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });

  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /fill-up-history rejects a request with no Authorization header", async () => {
  const response = await fetch(`${baseUrl}/fill-up-history`);

  assert.equal(response.status, 401);
});

test("POST /fill-up-history rejects a request with no Authorization header", async () => {
  const response = await fetch(`${baseUrl}/fill-up-history`, {
    method: "POST",
  });

  assert.equal(response.status, 401);
});

test("GET /fill-up-history/internal rejects a request with no internal token", async () => {
  const response = await fetch(
    `${baseUrl}/fill-up-history/internal?firebase_uid=some-uid`,
  );

  assert.equal(response.status, 401);
});

test("GET /fill-up-history/internal rejects a request with the wrong internal token", async () => {
  const response = await fetch(
    `${baseUrl}/fill-up-history/internal?firebase_uid=some-uid`,
    {
      headers: { "X-Internal-Token": "wrong-token" },
    },
  );

  assert.equal(response.status, 401);
});

test("GET /fill-up-history/internal rejects a missing firebase_uid query param even with a valid token", async () => {
  const response = await fetch(`${baseUrl}/fill-up-history/internal`, {
    headers: { "X-Internal-Token": CORRECT_INTERNAL_TOKEN },
  });

  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: string };
  assert.equal(body.error, "firebase_uid query param required");
});

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

test("entrySchema accepts a missing fill-up date", () => {
  const result = entrySchema.safeParse({
    milesDriven: 150,
    fuelPrice: 3.89,
    combinedMpg: 30,
    tankCapacity: 14,
    gallons: 12.4,
    observedCost: 48.14,
  });

  assert.equal(result.success, true);
});

test("entrySchema rejects values too large for their NUMERIC(10, 4) columns", () => {
  const valid = {
    milesDriven: 150,
    fuelPrice: 3.89,
    combinedMpg: 30,
    tankCapacity: 14,
    gallons: 12.4,
    observedCost: 48.14,
  };

  for (const field of ["fuelPrice", "gallons", "observedCost"] as const) {
    const result = entrySchema.safeParse({ ...valid, [field]: 1_000_000 });
    assert.equal(result.success, false, field);
  }

  // NUMERIC(10, 2) columns still allow larger values.
  assert.equal(
    entrySchema.safeParse({ ...valid, milesDriven: 1_000_000 }).success,
    true,
  );
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

test("entrySchema accepts an explicit vehicleId", () => {
  const result = entrySchema.safeParse({
    milesDriven: 150,
    fuelPrice: 3.89,
    combinedMpg: 30,
    tankCapacity: 14,
    gallons: 12.4,
    observedCost: 48.14,
    vehicleId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  });

  assert.equal(result.success, true);
});

test("entrySchema accepts a null vehicleId", () => {
  const result = entrySchema.safeParse({
    milesDriven: 150,
    fuelPrice: 3.89,
    combinedMpg: 30,
    tankCapacity: 14,
    gallons: 12.4,
    observedCost: 48.14,
    vehicleId: null,
  });

  assert.equal(result.success, true);
});

test("entrySchema rejects a non-UUID vehicleId", () => {
  const result = entrySchema.safeParse({
    milesDriven: 150,
    fuelPrice: 3.89,
    combinedMpg: 30,
    tankCapacity: 14,
    gallons: 12.4,
    observedCost: 48.14,
    vehicleId: "not-a-uuid",
  });

  assert.equal(result.success, false);
});

test("reassignVehicleSchema accepts a UUID", () => {
  const result = reassignVehicleSchema.safeParse({
    vehicleId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  });

  assert.equal(result.success, true);
});

test("reassignVehicleSchema accepts null (unassign)", () => {
  const result = reassignVehicleSchema.safeParse({ vehicleId: null });

  assert.equal(result.success, true);
});

test("reassignVehicleSchema rejects a missing vehicleId field", () => {
  const result = reassignVehicleSchema.safeParse({});

  assert.equal(result.success, false);
});

test("PATCH /fill-up-history/:entryId rejects a request with no Authorization header", async () => {
  const response = await fetch(
    `${baseUrl}/fill-up-history/3fa85f64-5717-4562-b3fc-2c963f66afa6`,
    {
      method: "PATCH",
    },
  );

  assert.equal(response.status, 401);
});

test("DELETE /fill-up-history/:entryId rejects a request with no Authorization header", async () => {
  const response = await fetch(
    `${baseUrl}/fill-up-history/3fa85f64-5717-4562-b3fc-2c963f66afa6`,
    {
      method: "DELETE",
    },
  );

  assert.equal(response.status, 401);
});

test("DELETE /fill-up-history rejects a request with no Authorization header", async () => {
  const response = await fetch(`${baseUrl}/fill-up-history`, {
    method: "DELETE",
  });

  assert.equal(response.status, 401);
});
