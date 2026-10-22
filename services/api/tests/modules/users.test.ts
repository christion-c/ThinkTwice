import { DEFAULT_CATEGORIES, type UserProfile } from "@thinktwice/shared";
import { asc } from "drizzle-orm";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import type { App } from "../../src/app.ts";
import { createDatabase } from "../../src/db/client.ts";
import { categories, users } from "../../src/db/schema.ts";
import { withUserScope } from "../../src/db/user-scope.ts";
import { buildTestApp } from "../helpers/app.ts";
import { resetDatabase, testDatabaseUrls } from "../helpers/database.ts";
import { authHeaders, signTestToken } from "../helpers/tokens.ts";
import { describeEndpointAuthentication } from "../security/endpoint-security.ts";

const urls = testDatabaseUrls();
const { db, pool } = createDatabase(urls.app);

const ALICE = "alice-firebase-uid";
const BOB = "bob-firebase-uid";

/** Builds the app connected to the test database. */
function buildAppWithDatabase(): Promise<App> {
  return buildTestApp({ databaseUrl: urls.app });
}

for (const endpoint of [
  { method: "GET", url: "/me" },
  { method: "POST", url: "/me", payload: { timezone: "UTC" } },
  { method: "PATCH", url: "/me", payload: { timezone: "UTC" } },
  { method: "DELETE", url: "/me" },
] as const) {
  describeEndpointAuthentication(endpoint, buildAppWithDatabase);
}

let app: App;

beforeEach(async () => {
  await resetDatabase(urls.owner);
  app = await buildAppWithDatabase();
});

afterEach(async () => {
  await app.close();
});

afterAll(async () => {
  await pool.end();
});

/** Sends a request to /me as the given Firebase user. */
async function asUser(
  firebaseUid: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  payload?: object,
) {
  return app.inject({
    method,
    url: "/me",
    headers: await authHeaders(firebaseUid),
    ...(payload === undefined ? {} : { payload }),
  });
}

/** Creates an account for the given Firebase user and returns its profile. */
async function signUp(firebaseUid: string, timezone = "America/Chicago") {
  const response = await asUser(firebaseUid, "POST", { timezone });
  expect(response.statusCode).toBe(201);
  return response.json<UserProfile>();
}

/** Returns the categories the given user can see, in display order. */
async function categoriesOf(firebaseUid: string, userId: string) {
  return withUserScope(db, { firebaseUid, userId }, (tx) =>
    tx.select().from(categories).orderBy(asc(categories.sortOrder)),
  );
}

describe("POST /me", () => {
  it("creates the account from the verified token, with the default categories in order", async () => {
    const profile = await signUp(ALICE);
    expect(profile).toMatchObject({
      email: `${ALICE}@example.com`,
      timezone: "America/Chicago",
      monthlyBudgetCents: null,
    });
    const created = await categoriesOf(ALICE, profile.id);
    expect(created.map(({ name, type }) => ({ name, type }))).toEqual(
      DEFAULT_CATEGORIES,
    );
    expect(created.map((category) => category.sortOrder)).toEqual(
      DEFAULT_CATEGORIES.map((_category, index) => index),
    );
  });

  it("returns the existing account on later calls without duplicating anything", async () => {
    const first = await signUp(ALICE);
    const again = await asUser(ALICE, "POST", { timezone: "Europe/London" });
    expect(again.statusCode).toBe(200);
    expect(again.json()).toEqual(first);
    expect(await categoriesOf(ALICE, first.id)).toHaveLength(
      DEFAULT_CATEGORIES.length,
    );
  });

  it("creates exactly one account when several requests arrive at once", async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        asUser(ALICE, "POST", { timezone: "UTC" }),
      ),
    );
    const statuses = responses.map((response) => response.statusCode).sort();
    expect(statuses).toEqual([200, 200, 200, 200, 201]);
    const ids = new Set(
      responses.map((response) => response.json<UserProfile>().id),
    );
    expect(ids.size).toBe(1);
    const [id] = ids;
    expect(await categoriesOf(ALICE, id ?? "")).toHaveLength(
      DEFAULT_CATEGORIES.length,
    );
  });

  it.each([
    { timezone: "Mars/Olympus_Mons" },
    {},
    { timezone: "UTC", email: "someone-else@example.com" },
    { timezone: "UTC", firebaseUid: BOB },
    { timezone: "UTC", userId: "0199f3c2-7c1e-7a3b-9d2e-1234567890ab" },
  ])("rejects the body %o", async (payload) => {
    const response = await asUser(ALICE, "POST", payload);
    expect(response.statusCode).toBe(400);
    expect(response.json<{ error: { code: string } }>().error.code).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("requires the sign-in to have an email address", async () => {
    const token = await signTestToken(ALICE, {
      claims: { email: undefined },
    });
    const response = await app.inject({
      method: "POST",
      url: "/me",
      headers: { authorization: `Bearer ${token}` },
      payload: { timezone: "UTC" },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "EMAIL_REQUIRED",
        message: "Please sign in with an account that has an email address.",
      },
    });
  });
});

describe("GET /me", () => {
  it("asks a signed-in user without an account to finish setting up", async () => {
    const response = await asUser(ALICE, "GET");
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: "ACCOUNT_NOT_FOUND",
        message: "Let's finish setting up your account first.",
      },
    });
  });

  it("returns the profile, without the Firebase UID", async () => {
    const profile = await signUp(ALICE);
    const response = await asUser(ALICE, "GET");
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(profile);
    expect(Object.keys(response.json<UserProfile>()).sort()).toEqual([
      "createdAt",
      "email",
      "id",
      "monthlyBudgetCents",
      "timezone",
    ]);
  });
});

describe("PATCH /me", () => {
  it("updates the time zone and budget, and clears the budget with null", async () => {
    await signUp(ALICE);
    const updated = await asUser(ALICE, "PATCH", {
      timezone: "Europe/London",
      monthlyBudgetCents: 200_000,
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      timezone: "Europe/London",
      monthlyBudgetCents: 200_000,
    });
    const cleared = await asUser(ALICE, "PATCH", { monthlyBudgetCents: null });
    expect(cleared.json()).toMatchObject({ monthlyBudgetCents: null });
  });

  it.each([
    {},
    { monthlyBudgetCents: 0 },
    { monthlyBudgetCents: 1.5 },
    { timezone: "nowhere" },
    { email: "someone-else@example.com" },
  ])("rejects the body %o", async (payload) => {
    await signUp(ALICE);
    expect((await asUser(ALICE, "PATCH", payload)).statusCode).toBe(400);
  });

  it("returns 404 before the account exists", async () => {
    const response = await asUser(ALICE, "PATCH", { timezone: "UTC" });
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /me", () => {
  it("deletes the account and all of its data", async () => {
    const profile = await signUp(ALICE);
    const response = await asUser(ALICE, "DELETE");
    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");
    expect((await asUser(ALICE, "GET")).statusCode).toBe(404);
    expect(await categoriesOf(ALICE, profile.id)).toEqual([]);
  });

  it("returns 404 when there is no account to delete", async () => {
    expect((await asUser(ALICE, "DELETE")).statusCode).toBe(404);
  });
});

describe("users can only ever reach their own account", () => {
  it("each user sees only their own profile", async () => {
    const alice = await signUp(ALICE);
    const bob = await signUp(BOB, "Europe/London");
    expect((await asUser(ALICE, "GET")).json()).toEqual(alice);
    expect((await asUser(BOB, "GET")).json()).toEqual(bob);
  });

  it("changing or deleting one account leaves the other untouched", async () => {
    await signUp(ALICE);
    const bob = await signUp(BOB, "Europe/London");
    await asUser(ALICE, "PATCH", { timezone: "Asia/Tokyo" });
    await asUser(ALICE, "DELETE");

    expect((await asUser(BOB, "GET")).json()).toEqual(bob);
    expect(await categoriesOf(BOB, bob.id)).toHaveLength(
      DEFAULT_CATEGORIES.length,
    );
    const bobRows = await withUserScope(
      db,
      { firebaseUid: BOB, userId: bob.id },
      (tx) => tx.select().from(users),
    );
    expect(bobRows.map((row) => row.id)).toEqual([bob.id]);
  });
});
