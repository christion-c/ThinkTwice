import assert from "node:assert/strict";
import { test } from "node:test";

import { createVehicleSchema, updateVehicleSchema } from "./vehicle.routes.js";

test("createVehicleSchema accepts a minimal valid vehicle", () => {
  const result = createVehicleSchema.safeParse({ nickname: "Daily Driver" });

  assert.equal(result.success, true);
});

test("createVehicleSchema rejects an empty nickname", () => {
  const result = createVehicleSchema.safeParse({ nickname: "" });

  assert.equal(result.success, false);
});

test("createVehicleSchema rejects unknown fields", () => {
  const result = createVehicleSchema.safeParse({
    nickname: "Daily Driver",
    vin: "1HGCM82633A004352",
  });

  assert.equal(result.success, false);
});

test("createVehicleSchema rejects an out-of-range model year", () => {
  const result = createVehicleSchema.safeParse({
    nickname: "Daily Driver",
    modelYear: 1800,
  });

  assert.equal(result.success, false);
});

test("createVehicleSchema rejects a non-positive tank capacity", () => {
  const result = createVehicleSchema.safeParse({
    nickname: "Daily Driver",
    tankCapacityGallons: 0,
  });

  assert.equal(result.success, false);
});

test("updateVehicleSchema rejects an empty patch", () => {
  const result = updateVehicleSchema.safeParse({});

  assert.equal(result.success, false);
});

test("updateVehicleSchema accepts a single-field patch", () => {
  const result = updateVehicleSchema.safeParse({ nickname: "Weekend Car" });

  assert.equal(result.success, true);
});
