import { DEFAULT_CATEGORIES, type Category } from "@thinktwice/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as z from "zod";

import type { App } from "../../src/app.ts";
import { buildTestApp } from "../helpers/app.ts";
import { resetDatabase, testDatabaseUrls } from "../helpers/database.ts";
import { authHeaders } from "../helpers/tokens.ts";
import { describeEndpointAuthentication } from "../security/endpoint-security.ts";

const urls = testDatabaseUrls();

const errorResponseSchema = z.object({ error: z.object({ code: z.string() }) });

const ALICE = "alice-firebase-uid";
const BOB = "bob-firebase-uid";
const MISSING_ID = "0199f3c2-7c1e-7a3b-9d2e-1234567890ab";

/** Builds the app connected to the test database. */
function buildAppWithDatabase(): Promise<App> {
  return buildTestApp({ databaseUrl: urls.app });
}

for (const endpoint of [
  { method: "GET", url: "/categories" },
  {
    method: "POST",
    url: "/categories",
    payload: { name: "Pets", type: "essential" },
  },
  {
    method: "PATCH",
    url: `/categories/${MISSING_ID}`,
    payload: { isHidden: true },
  },
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

/** Sends a request as the given Firebase user. */
async function asUser(
  firebaseUid: string,
  method: "GET" | "POST" | "PATCH",
  url: string,
  payload?: object,
) {
  return app.inject({
    method,
    url,
    headers: await authHeaders(firebaseUid),
    ...(payload === undefined ? {} : { payload }),
  });
}

/** Creates an account (with the default categories) for the given Firebase user. */
async function signUp(firebaseUid: string): Promise<void> {
  const response = await asUser(firebaseUid, "POST", "/me", {
    timezone: "UTC",
  });
  expect(response.statusCode).toBe(201);
}

/** Returns the given user's categories through the API. */
async function categoriesOf(firebaseUid: string): Promise<Category[]> {
  const response = await asUser(firebaseUid, "GET", "/categories");
  expect(response.statusCode).toBe(200);
  return response.json<{ categories: Category[] }>().categories;
}

/** Returns the error code from an error response, checking its shape. */
function errorCode(response: { json: () => unknown }): string {
  return errorResponseSchema.parse(response.json()).error.code;
}

describe("GET /categories", () => {
  it("returns the default categories in display order", async () => {
    await signUp(ALICE);
    const listed = await categoriesOf(ALICE);
    expect(listed.map(({ name, type }) => ({ name, type }))).toEqual(
      DEFAULT_CATEGORIES,
    );
    expect(listed.every((category) => !category.isHidden)).toBe(true);
    expect(Object.keys(listed[0] ?? {}).sort()).toEqual([
      "id",
      "isHidden",
      "name",
      "sortOrder",
      "type",
    ]);
  });

  it("asks a signed-in user without an account to finish setting up", async () => {
    const response = await asUser(ALICE, "GET", "/categories");
    expect(response.statusCode).toBe(404);
    expect(errorCode(response)).toBe("ACCOUNT_NOT_FOUND");
  });
});

describe("POST /categories", () => {
  it("adds a trimmed category at the end of the list", async () => {
    await signUp(ALICE);
    const response = await asUser(ALICE, "POST", "/categories", {
      name: "  Pets  ",
      type: "essential",
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      name: "Pets",
      type: "essential",
      isHidden: false,
      sortOrder: DEFAULT_CATEGORIES.length,
    });
    expect((await categoriesOf(ALICE)).at(-1)?.name).toBe("Pets");
  });

  it("rejects a name the user already has, ignoring case", async () => {
    await signUp(ALICE);
    const response = await asUser(ALICE, "POST", "/categories", {
      name: "coffee",
      type: "discretionary",
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: {
        code: "CATEGORY_NAME_TAKEN",
        message: "You already have a category with that name.",
      },
    });
  });

  it.each([
    {},
    { name: "", type: "essential" },
    { name: "   ", type: "essential" },
    { name: "x".repeat(41), type: "essential" },
    { name: "Pets", type: "luxury" },
    { name: "Pets", type: "essential", userId: MISSING_ID },
    { name: "Pets", type: "essential", isHidden: true },
    { name: "'; DROP TABLE categories; --", type: "essential", extra: 1 },
  ])("rejects the body %o", async (payload) => {
    await signUp(ALICE);
    const response = await asUser(ALICE, "POST", "/categories", payload);
    expect(response.statusCode).toBe(400);
    expect(errorCode(response)).toBe("VALIDATION_ERROR");
  });

  it("stores SQL-looking names as plain text", async () => {
    await signUp(ALICE);
    const name = "'); DROP TABLE expenses; --";
    const response = await asUser(ALICE, "POST", "/categories", {
      name,
      type: "discretionary",
    });
    expect(response.statusCode).toBe(201);
    expect((await categoriesOf(ALICE)).at(-1)?.name).toBe(name);
  });
});

describe("PATCH /categories/:id", () => {
  it("renames, retypes, hides and reorders a category", async () => {
    await signUp(ALICE);
    const [coffee] = (await categoriesOf(ALICE)).filter(
      (category) => category.name === "Coffee",
    );
    const response = await asUser(
      ALICE,
      "PATCH",
      `/categories/${coffee?.id ?? ""}`,
      {
        name: "Coffee & Tea",
        type: "essential",
        isHidden: true,
        sortOrder: 0,
      },
    );
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: coffee?.id,
      name: "Coffee & Tea",
      type: "essential",
      isHidden: true,
      sortOrder: 0,
    });
  });

  it("rejects renaming to another of the user's category names", async () => {
    await signUp(ALICE);
    const [first] = await categoriesOf(ALICE);
    const response = await asUser(
      ALICE,
      "PATCH",
      `/categories/${first?.id ?? ""}`,
      {
        name: "OTHER",
      },
    );
    expect(response.statusCode).toBe(409);
    expect(errorCode(response)).toBe("CATEGORY_NAME_TAKEN");
  });

  it("returns 404 for a category that doesn't exist", async () => {
    await signUp(ALICE);
    const response = await asUser(ALICE, "PATCH", `/categories/${MISSING_ID}`, {
      isHidden: true,
    });
    expect(response.statusCode).toBe(404);
    expect(errorCode(response)).toBe("CATEGORY_NOT_FOUND");
  });

  it.each([
    {},
    { sortOrder: -1 },
    { sortOrder: 1.5 },
    { isHidden: "yes" },
    { id: MISSING_ID },
  ])("rejects the body %o", async (payload) => {
    await signUp(ALICE);
    const [first] = await categoriesOf(ALICE);
    const response = await asUser(
      ALICE,
      "PATCH",
      `/categories/${first?.id ?? ""}`,
      payload,
    );
    expect(response.statusCode).toBe(400);
  });

  it.each(["not-a-uuid", "1", "..%2F..%2Fme", "%27%20OR%201%3D1"])(
    "rejects the ID %s",
    async (id) => {
      await signUp(ALICE);
      const response = await asUser(ALICE, "PATCH", `/categories/${id}`, {
        isHidden: true,
      });
      expect(response.statusCode).toBe(400);
    },
  );
});

describe("users can only ever reach their own categories", () => {
  it("each user lists only their own categories", async () => {
    await signUp(ALICE);
    await signUp(BOB);
    await asUser(ALICE, "POST", "/categories", {
      name: "Pets",
      type: "essential",
    });
    const aliceIds = new Set((await categoriesOf(ALICE)).map(({ id }) => id));
    const bobCategories = await categoriesOf(BOB);
    expect(bobCategories).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(bobCategories.some(({ id }) => aliceIds.has(id))).toBe(false);
  });

  it("a user can't change someone else's category, and gets the same 404 as a missing one", async () => {
    await signUp(ALICE);
    await signUp(BOB);
    const [bobsFirst] = await categoriesOf(BOB);
    const response = await asUser(
      ALICE,
      "PATCH",
      `/categories/${bobsFirst?.id ?? ""}`,
      {
        name: "Hijacked",
      },
    );
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual(
      (
        await asUser(ALICE, "PATCH", `/categories/${MISSING_ID}`, {
          name: "Hijacked",
        })
      ).json(),
    );
    expect((await categoriesOf(BOB))[0]).toEqual(bobsFirst);
  });

  it("the same name can exist for two different users", async () => {
    await signUp(ALICE);
    await signUp(BOB);
    const payload = { name: "Pets", type: "essential" };
    expect(
      (await asUser(ALICE, "POST", "/categories", payload)).statusCode,
    ).toBe(201);
    expect((await asUser(BOB, "POST", "/categories", payload)).statusCode).toBe(
      201,
    );
  });
});
