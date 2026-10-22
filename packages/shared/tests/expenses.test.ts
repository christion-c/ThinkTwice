import { describe, expect, it } from "vitest";

import {
  createExpenseSchema,
  EXPENSE_NOTE_MAX_LENGTH,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from "../src/index.js";

const CATEGORY_ID = "0199f3c2-7c1e-7a3b-9d2e-1234567890ab";

describe("createExpenseSchema", () => {
  it("accepts the minimum fields", () => {
    expect(
      createExpenseSchema.parse({ amountCents: 450, categoryId: CATEGORY_ID }),
    ).toEqual({
      amountCents: 450,
      categoryId: CATEGORY_ID,
    });
  });

  it("accepts every field, trimming the note", () => {
    expect(
      createExpenseSchema.parse({
        amountCents: 450,
        categoryId: CATEGORY_ID,
        spentOn: "2026-10-22",
        note: "  latte  ",
      }),
    ).toEqual({
      amountCents: 450,
      categoryId: CATEGORY_ID,
      spentOn: "2026-10-22",
      note: "latte",
    });
  });

  it("turns an empty note into null", () => {
    const parsed = createExpenseSchema.parse({
      amountCents: 450,
      categoryId: CATEGORY_ID,
      note: "   ",
    });
    expect(parsed.note).toBeNull();
  });

  it("rejects a note that is too long", () => {
    const note = "x".repeat(EXPENSE_NOTE_MAX_LENGTH + 1);
    expect(
      createExpenseSchema.safeParse({
        amountCents: 450,
        categoryId: CATEGORY_ID,
        note,
      }).success,
    ).toBe(false);
  });

  it.each([
    "2026-02-30",
    "2026-13-01",
    "10/22/2026",
    "2026-10-22T00:00:00Z",
    "",
  ])("rejects the invalid date %p", (spentOn) => {
    expect(
      createExpenseSchema.safeParse({
        amountCents: 450,
        categoryId: CATEGORY_ID,
        spentOn,
      }).success,
    ).toBe(false);
  });

  it.each(["1", "not-a-uuid", "' OR 1=1 --", ""])(
    "rejects the invalid category ID %p",
    (categoryId) => {
      expect(
        createExpenseSchema.safeParse({ amountCents: 450, categoryId }).success,
      ).toBe(false);
    },
  );

  it("rejects unknown fields such as a client-supplied userId", () => {
    const result = createExpenseSchema.safeParse({
      amountCents: 450,
      categoryId: CATEGORY_ID,
      userId: CATEGORY_ID,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateExpenseSchema", () => {
  it("accepts a single field", () => {
    expect(updateExpenseSchema.parse({ amountCents: 500 })).toEqual({
      amountCents: 500,
    });
  });

  it("allows clearing the note", () => {
    expect(updateExpenseSchema.parse({ note: null })).toEqual({ note: null });
  });

  it("rejects an empty update", () => {
    expect(updateExpenseSchema.safeParse({}).success).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(
      updateExpenseSchema.safeParse({ amountCents: 500, id: CATEGORY_ID })
        .success,
    ).toBe(false);
  });
});

describe("listExpensesQuerySchema", () => {
  it("defaults the limit and coerces it from the query string", () => {
    expect(listExpensesQuerySchema.parse({})).toEqual({ limit: 200 });
    expect(listExpensesQuerySchema.parse({ limit: "50" })).toEqual({
      limit: 50,
    });
  });

  it("accepts a date range", () => {
    expect(
      listExpensesQuerySchema.parse({ from: "2026-10-01", to: "2026-10-31" }),
    ).toEqual({ from: "2026-10-01", to: "2026-10-31", limit: 200 });
  });

  it.each([
    { from: "2026-10-31", to: "2026-10-01" },
    { from: "not-a-date" },
    { limit: "0" },
    { limit: "501" },
    { limit: "ten" },
    { userId: "someone-else" },
  ])("rejects %o", (query) => {
    expect(listExpensesQuerySchema.safeParse(query).success).toBe(false);
  });
});
