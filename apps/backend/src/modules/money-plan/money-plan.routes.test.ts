import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";

import { createApp } from "../../app.js";
import { moneyItemSchema, payProfileSchema } from "./money-plan.routes.js";

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

test("GET /money-plan rejects a request with no Authorization header", async () => {
  const response = await fetch(`${baseUrl}/money-plan`);

  assert.equal(response.status, 401);
});

test("POST /money-plan/items rejects a request with no Authorization header", async () => {
  const response = await fetch(`${baseUrl}/money-plan/items`, { method: "POST" });

  assert.equal(response.status, 401);
});

test("payProfileSchema accepts a valid profile", () => {
  const result = payProfileSchema.safeParse({
    hourlyRate: 18.5,
    hoursPerWeek: 40,
    payFrequency: "biweekly",
    takeHomePerCheck: 1012.34,
  });

  assert.equal(result.success, true);
});

test("payProfileSchema rejects an unknown pay frequency", () => {
  const result = payProfileSchema.safeParse({
    hourlyRate: 18.5,
    hoursPerWeek: 40,
    payFrequency: "daily",
    takeHomePerCheck: 1012.34,
  });

  assert.equal(result.success, false);
});

test("payProfileSchema rejects fractions of a cent", () => {
  const result = payProfileSchema.safeParse({
    hourlyRate: 18.555,
    hoursPerWeek: 40,
    payFrequency: "weekly",
    takeHomePerCheck: 500,
  });

  assert.equal(result.success, false);
});

test("payProfileSchema accepts cents that aren't exact in binary floating point", () => {
  const result = payProfileSchema.safeParse({
    hourlyRate: 0.29,
    hoursPerWeek: 40,
    payFrequency: "weekly",
    takeHomePerCheck: 1.13,
  });

  assert.equal(result.success, true);
});

test("moneyItemSchema accepts a bill with just a name and amount", () => {
  const result = moneyItemSchema.safeParse({ kind: "bill", name: "Phone", monthlyAmount: 45 });

  assert.equal(result.success, true);
});

test("moneyItemSchema rejects a bill carrying debt-only fields", () => {
  const result = moneyItemSchema.safeParse({
    kind: "bill",
    name: "Phone",
    monthlyAmount: 45,
    balance: 100,
  });

  assert.equal(result.success, false);
});

test("moneyItemSchema accepts a deferred debt with optional fields", () => {
  const result = moneyItemSchema.safeParse({
    kind: "loan",
    name: "School loan",
    monthlyAmount: 250,
    balance: 9000,
    balanceAsOf: "2026-10-02",
    aprPercent: 4.5,
    startsOn: "2027-01-01",
    fromPaycheck: false,
  });

  assert.equal(result.success, true);
});

test("moneyItemSchema rejects a debt without a balance", () => {
  const result = moneyItemSchema.safeParse({
    kind: "card",
    name: "Card",
    monthlyAmount: 40,
    balanceAsOf: "2026-10-02",
  });

  assert.equal(result.success, false);
});

test("moneyItemSchema rejects a start date that isn't the 1st of a month", () => {
  const result = moneyItemSchema.safeParse({
    kind: "loan",
    name: "School loan",
    monthlyAmount: 250,
    balance: 9000,
    balanceAsOf: "2026-10-02",
    startsOn: "2027-01-15",
  });

  assert.equal(result.success, false);
});

test("moneyItemSchema accepts an asset with a value", () => {
  const result = moneyItemSchema.safeParse({
    kind: "asset",
    name: "Savings",
    balance: 1200,
    balanceAsOf: "2026-10-02",
  });

  assert.equal(result.success, true);
});

test("moneyItemSchema rejects an empty name and an unknown kind", () => {
  assert.equal(moneyItemSchema.safeParse({ kind: "bill", name: " ", monthlyAmount: 1 }).success, false);
  assert.equal(moneyItemSchema.safeParse({ kind: "income", name: "Job", monthlyAmount: 1 }).success, false);
});
