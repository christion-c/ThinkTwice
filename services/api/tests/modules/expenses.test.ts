import {
  monthContaining,
  todayIn,
  type Category,
  type Expense,
} from "@thinktwice/shared";
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
const TIMEZONE = "America/Chicago";

/** Builds the app connected to the test database. */
function buildAppWithDatabase(): Promise<App> {
  return buildTestApp({ databaseUrl: urls.app });
}

for (const endpoint of [
  { method: "GET", url: "/expenses" },
  {
    method: "POST",
    url: "/expenses",
    payload: { amountCents: 450, categoryId: MISSING_ID },
  },
  {
    method: "PATCH",
    url: `/expenses/${MISSING_ID}`,
    payload: { amountCents: 500 },
  },
  { method: "DELETE", url: `/expenses/${MISSING_ID}` },
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
  method: "GET" | "POST" | "PATCH" | "DELETE",
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

/** Creates an account for the given Firebase user and returns their categories. */
async function signUp(firebaseUid: string): Promise<Category[]> {
  const response = await asUser(firebaseUid, "POST", "/me", {
    timezone: TIMEZONE,
  });
  expect(response.statusCode).toBe(201);
  return (await asUser(firebaseUid, "GET", "/categories")).json<{
    categories: Category[];
  }>().categories;
}

/** Returns the ID of the first category in a list, failing the test if there is none. */
function firstId(categories: Category[]): string {
  const [first] = categories;
  if (first === undefined) {
    throw new Error("Expected at least one category.");
  }
  return first.id;
}

/** Logs an expense through the API and returns it. */
async function logExpense(
  firebaseUid: string,
  payload: { amountCents: number; categoryId: string; spentOn?: string },
): Promise<Expense> {
  const response = await asUser(firebaseUid, "POST", "/expenses", payload);
  expect(response.statusCode).toBe(201);
  return response.json<Expense>();
}

/** Lists the given user's expenses through the API. */
async function expensesOf(firebaseUid: string, query = ""): Promise<Expense[]> {
  const response = await asUser(firebaseUid, "GET", `/expenses${query}`);
  expect(response.statusCode).toBe(200);
  return response.json<{ expenses: Expense[] }>().expenses;
}

/** Returns the error code from an error response, checking its shape. */
function errorCode(response: { json: () => unknown }): string {
  return errorResponseSchema.parse(response.json()).error.code;
}

/** Returns the date the given number of days before today in the test time zone. */
function daysAgo(days: number): string {
  const date = new Date(`${todayIn(TIMEZONE)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

describe("POST /expenses", () => {
  it("logs an expense dated today in the user's time zone by default", async () => {
    const categoryId = firstId(await signUp(ALICE));
    const response = await asUser(ALICE, "POST", "/expenses", {
      amountCents: 450,
      categoryId,
      note: "  Latte  ",
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      amountCents: 450,
      categoryId,
      spentOn: todayIn(TIMEZONE),
      note: "Latte",
    });
    expect(Object.keys(response.json<Expense>()).sort()).toEqual([
      "amountCents",
      "categoryId",
      "createdAt",
      "id",
      "note",
      "spentOn",
    ]);
  });

  it("stores an empty note as no note", async () => {
    const categoryId = firstId(await signUp(ALICE));
    const response = await asUser(ALICE, "POST", "/expenses", {
      amountCents: 450,
      categoryId,
      note: "   ",
    });
    expect(response.json()).toMatchObject({ note: null });
  });

  it("rejects a date in the future", async () => {
    const categoryId = firstId(await signUp(ALICE));
    const response = await asUser(ALICE, "POST", "/expenses", {
      amountCents: 450,
      categoryId,
      spentOn: daysAgo(-2),
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "FUTURE_DATE",
        message: "Expenses can't be dated in the future.",
      },
    });
  });

  it("rejects a category that doesn't exist", async () => {
    await signUp(ALICE);
    const response = await asUser(ALICE, "POST", "/expenses", {
      amountCents: 450,
      categoryId: MISSING_ID,
    });
    expect(response.statusCode).toBe(400);
    expect(errorCode(response)).toBe("CATEGORY_NOT_FOUND");
  });

  it.each([
    {},
    { amountCents: 0 },
    { amountCents: -450 },
    { amountCents: 4.5 },
    { amountCents: "450" },
    { amountCents: 100_000_000_000 },
    { amountCents: 450, spentOn: "2026-02-30" },
    { amountCents: 450, spentOn: "10/22/2026" },
    { amountCents: 450, note: "x".repeat(201) },
    { amountCents: 450, userId: MISSING_ID },
  ])("rejects the body %o", async (payload) => {
    const categoryId = firstId(await signUp(ALICE));
    const response = await asUser(ALICE, "POST", "/expenses", {
      categoryId,
      ...payload,
    });
    expect(response.statusCode).toBe(400);
    expect(errorCode(response)).toBe("VALIDATION_ERROR");
  });

  it("returns 404 before the account exists", async () => {
    const response = await asUser(ALICE, "POST", "/expenses", {
      amountCents: 450,
      categoryId: MISSING_ID,
    });
    expect(response.statusCode).toBe(404);
    expect(errorCode(response)).toBe("ACCOUNT_NOT_FOUND");
  });
});

describe("GET /expenses", () => {
  it("defaults to this month, newest first", async () => {
    const categoryId = firstId(await signUp(ALICE));
    const thisMonth = monthContaining(todayIn(TIMEZONE));
    const older = await logExpense(ALICE, {
      amountCents: 100,
      categoryId,
      spentOn: thisMonth.from,
    });
    const newer = await logExpense(ALICE, { amountCents: 200, categoryId });
    await logExpense(ALICE, {
      amountCents: 300,
      categoryId,
      spentOn: "2025-01-15",
    });
    const listed = await expensesOf(ALICE);
    expect(listed.map(({ id }) => id)).toEqual([newer.id, older.id]);
  });

  it("filters by a date range and honours the limit", async () => {
    const categoryId = firstId(await signUp(ALICE));
    for (const spentOn of [
      "2025-01-01",
      "2025-01-15",
      "2025-01-31",
      "2025-02-01",
    ]) {
      await logExpense(ALICE, { amountCents: 100, categoryId, spentOn });
    }
    const january = await expensesOf(ALICE, "?from=2025-01-01&to=2025-01-31");
    expect(january.map(({ spentOn }) => spentOn)).toEqual([
      "2025-01-31",
      "2025-01-15",
      "2025-01-01",
    ]);
    const limited = await expensesOf(
      ALICE,
      "?from=2025-01-01&to=2025-01-31&limit=2",
    );
    expect(limited).toHaveLength(2);
  });

  it.each([
    "?from=2025-02-01&to=2025-01-01",
    "?from=yesterday",
    "?limit=0",
    "?limit=501",
    "?limit=abc",
    "?userId=someone",
    "?from=2025-01-01'%20OR%201=1--",
  ])("rejects the query %s", async (query) => {
    await signUp(ALICE);
    const response = await asUser(ALICE, "GET", `/expenses${query}`);
    expect(response.statusCode).toBe(400);
    expect(errorCode(response)).toBe("VALIDATION_ERROR");
  });
});

describe("PATCH /expenses/:id", () => {
  it("edits an expense, and clears the note with null", async () => {
    const categories = await signUp(ALICE);
    const expense = await logExpense(ALICE, {
      amountCents: 450,
      categoryId: firstId(categories),
    });
    const otherCategoryId = firstId(categories.slice(1));
    const response = await asUser(ALICE, "PATCH", `/expenses/${expense.id}`, {
      amountCents: 525,
      categoryId: otherCategoryId,
      spentOn: daysAgo(1),
      note: null,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ...expense,
      amountCents: 525,
      categoryId: otherCategoryId,
      spentOn: daysAgo(1),
      note: null,
    });
  });

  it("rejects a future date and an unknown category", async () => {
    const categoryId = firstId(await signUp(ALICE));
    const expense = await logExpense(ALICE, { amountCents: 450, categoryId });
    const future = await asUser(ALICE, "PATCH", `/expenses/${expense.id}`, {
      spentOn: daysAgo(-2),
    });
    expect(errorCode(future)).toBe("FUTURE_DATE");
    const unknown = await asUser(ALICE, "PATCH", `/expenses/${expense.id}`, {
      categoryId: MISSING_ID,
    });
    expect(errorCode(unknown)).toBe("CATEGORY_NOT_FOUND");
  });

  it("returns 404 for an expense that doesn't exist", async () => {
    await signUp(ALICE);
    const response = await asUser(ALICE, "PATCH", `/expenses/${MISSING_ID}`, {
      amountCents: 500,
    });
    expect(response.statusCode).toBe(404);
    expect(errorCode(response)).toBe("EXPENSE_NOT_FOUND");
  });

  it.each([
    {},
    { amountCents: 0 },
    { id: MISSING_ID },
    { createdAt: "2020-01-01T00:00:00Z" },
  ])("rejects the body %o", async (payload) => {
    const categoryId = firstId(await signUp(ALICE));
    const expense = await logExpense(ALICE, { amountCents: 450, categoryId });
    const response = await asUser(
      ALICE,
      "PATCH",
      `/expenses/${expense.id}`,
      payload,
    );
    expect(response.statusCode).toBe(400);
  });
});

describe("DELETE /expenses/:id", () => {
  it("permanently deletes an expense", async () => {
    const categoryId = firstId(await signUp(ALICE));
    const expense = await logExpense(ALICE, { amountCents: 450, categoryId });
    const response = await asUser(ALICE, "DELETE", `/expenses/${expense.id}`);
    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");
    expect(await expensesOf(ALICE)).toEqual([]);
    const again = await asUser(ALICE, "DELETE", `/expenses/${expense.id}`);
    expect(again.statusCode).toBe(404);
  });

  it.each(["not-a-uuid", "1", "%27%20OR%201%3D1"])(
    "rejects the ID %s",
    async (id) => {
      await signUp(ALICE);
      expect(
        (await asUser(ALICE, "DELETE", `/expenses/${id}`)).statusCode,
      ).toBe(400);
    },
  );
});

describe("users can only ever reach their own expenses", () => {
  /** Signs up Alice and Bob, and logs one expense for Bob. */
  async function bobWithAnExpense() {
    const aliceCategories = await signUp(ALICE);
    const bobCategories = await signUp(BOB);
    const bobsExpense = await logExpense(BOB, {
      amountCents: 999,
      categoryId: firstId(bobCategories),
    });
    return { aliceCategories, bobCategories, bobsExpense };
  }

  it("a user never sees someone else's expenses in their list", async () => {
    const { aliceCategories } = await bobWithAnExpense();
    await logExpense(ALICE, {
      amountCents: 100,
      categoryId: firstId(aliceCategories),
    });
    const aliceList = await expensesOf(ALICE, "?from=2000-01-01");
    expect(aliceList.map(({ amountCents }) => amountCents)).toEqual([100]);
  });

  it("a user can't edit or delete someone else's expense, and gets the same 404 as a missing one", async () => {
    const { bobsExpense } = await bobWithAnExpense();
    const edit = await asUser(ALICE, "PATCH", `/expenses/${bobsExpense.id}`, {
      amountCents: 1,
    });
    const remove = await asUser(ALICE, "DELETE", `/expenses/${bobsExpense.id}`);
    const missing = await asUser(ALICE, "DELETE", `/expenses/${MISSING_ID}`);
    expect(edit.statusCode).toBe(404);
    expect(remove.statusCode).toBe(404);
    expect(remove.json()).toEqual(missing.json());
    expect(await expensesOf(BOB)).toEqual([bobsExpense]);
  });

  it("a user can't log or move an expense into someone else's category", async () => {
    const { aliceCategories, bobCategories } = await bobWithAnExpense();
    const bobsCategoryId = firstId(bobCategories);
    const create = await asUser(ALICE, "POST", "/expenses", {
      amountCents: 450,
      categoryId: bobsCategoryId,
    });
    expect(create.statusCode).toBe(400);
    expect(create.json()).toEqual(
      (
        await asUser(ALICE, "POST", "/expenses", {
          amountCents: 450,
          categoryId: MISSING_ID,
        })
      ).json(),
    );
    const own = await logExpense(ALICE, {
      amountCents: 450,
      categoryId: firstId(aliceCategories),
    });
    const move = await asUser(ALICE, "PATCH", `/expenses/${own.id}`, {
      categoryId: bobsCategoryId,
    });
    expect(errorCode(move)).toBe("CATEGORY_NOT_FOUND");
  });
});
