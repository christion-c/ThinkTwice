import test from "node:test";
import assert from "node:assert/strict";
import { after, before } from "node:test";
import type { AddressInfo } from "node:net";

import { createApp } from "../../app.js";
import {
  logSchema,
  reassignVehicleSchema,
} from "./daily-driving-log.routes.js";

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

test("GET /daily-driving-log rejects a request with no Authorization header", async () => {
  const response = await fetch(`${baseUrl}/daily-driving-log`);

  assert.equal(response.status, 401);
});

test("POST /daily-driving-log rejects a request with no Authorization header", async () => {
  const response = await fetch(`${baseUrl}/daily-driving-log`, {
    method: "POST",
  });

  assert.equal(response.status, 401);
});

test("logSchema accepts a valid daily driving log", () => {
  const result = logSchema.safeParse({
    logDate: "2026-08-24",
    milesDriven: 32,
  });

  assert.equal(result.success, true);
});

test("logSchema rejects an invalid date", () => {
  const result = logSchema.safeParse({
    logDate: "not-a-date",
    milesDriven: 32,
  });

  assert.equal(result.success, false);
});

test("logSchema rejects a negative miles value", () => {
  const result = logSchema.safeParse({
    logDate: "2026-08-24",
    milesDriven: -1,
  });

  assert.equal(result.success, false);
});

test("logSchema rejects an absurd miles value", () => {
  const result = logSchema.safeParse({
    logDate: "2026-08-24",
    milesDriven: 10000,
  });

  assert.equal(result.success, false);
});

test("logSchema rejects unknown fields", () => {
  const result = logSchema.safeParse({
    logDate: "2026-08-24",
    milesDriven: 32,
    extra: "field",
  });

  assert.equal(result.success, false);
});

test("logSchema accepts an explicit vehicleId", () => {
  const result = logSchema.safeParse({
    logDate: "2026-08-24",
    milesDriven: 32,
    vehicleId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  });

  assert.equal(result.success, true);
});

test("logSchema accepts a null vehicleId", () => {
  const result = logSchema.safeParse({
    logDate: "2026-08-24",
    milesDriven: 32,
    vehicleId: null,
  });

  assert.equal(result.success, true);
});

test("reassignVehicleSchema accepts a UUID or null but rejects a missing field", () => {
  assert.equal(
    reassignVehicleSchema.safeParse({
      vehicleId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    }).success,
    true,
  );
  assert.equal(
    reassignVehicleSchema.safeParse({ vehicleId: null }).success,
    true,
  );
  assert.equal(reassignVehicleSchema.safeParse({}).success, false);
});

test("PATCH /daily-driving-log/:logId rejects a request with no Authorization header", async () => {
  const response = await fetch(
    `${baseUrl}/daily-driving-log/3fa85f64-5717-4562-b3fc-2c963f66afa6`,
    {
      method: "PATCH",
    },
  );

  assert.equal(response.status, 401);
});

test("DELETE /daily-driving-log/:logId rejects a request with no Authorization header", async () => {
  const response = await fetch(
    `${baseUrl}/daily-driving-log/3fa85f64-5717-4562-b3fc-2c963f66afa6`,
    {
      method: "DELETE",
    },
  );

  assert.equal(response.status, 401);
});

test("DELETE /daily-driving-log rejects a request with no Authorization header", async () => {
  const response = await fetch(`${baseUrl}/daily-driving-log`, {
    method: "DELETE",
  });

  assert.equal(response.status, 401);
});
