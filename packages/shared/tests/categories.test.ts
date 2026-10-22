import { describe, expect, it } from "vitest";

import {
  CATEGORY_NAME_MAX_LENGTH,
  DEFAULT_CATEGORIES,
  createCategorySchema,
  updateCategorySchema,
} from "../src/index.js";

describe("createCategorySchema", () => {
  it("accepts a valid category and trims the name", () => {
    expect(
      createCategorySchema.parse({ name: "  Coffee  ", type: "discretionary" }),
    ).toEqual({
      name: "Coffee",
      type: "discretionary",
    });
  });

  it("rejects empty, whitespace-only and too-long names", () => {
    for (const name of ["", "   ", "x".repeat(CATEGORY_NAME_MAX_LENGTH + 1)]) {
      expect(
        createCategorySchema.safeParse({ name, type: "essential" }).success,
      ).toBe(false);
    }
  });

  it("rejects unknown category types", () => {
    expect(
      createCategorySchema.safeParse({ name: "Coffee", type: "fun" }).success,
    ).toBe(false);
  });

  it("rejects unknown fields such as a client-supplied userId", () => {
    const result = createCategorySchema.safeParse({
      name: "Coffee",
      type: "essential",
      userId: "0199f3c2-7c1e-7a3b-9d2e-1234567890ab",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCategorySchema", () => {
  it("accepts a single field", () => {
    expect(updateCategorySchema.parse({ isHidden: true })).toEqual({
      isHidden: true,
    });
  });

  it("rejects an empty update", () => {
    expect(updateCategorySchema.safeParse({}).success).toBe(false);
  });

  it("rejects a negative or fractional sort order", () => {
    expect(updateCategorySchema.safeParse({ sortOrder: -1 }).success).toBe(
      false,
    );
    expect(updateCategorySchema.safeParse({ sortOrder: 1.5 }).success).toBe(
      false,
    );
  });
});

describe("DEFAULT_CATEGORIES", () => {
  it("are all valid, with unique names", () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(createCategorySchema.safeParse(category).success).toBe(true);
    }
    const names = DEFAULT_CATEGORIES.map((category) =>
      category.name.toLowerCase(),
    );
    expect(new Set(names).size).toBe(names.length);
  });

  it("include both essential and discretionary categories", () => {
    const types = new Set(DEFAULT_CATEGORIES.map((category) => category.type));
    expect(types).toEqual(new Set(["essential", "discretionary"]));
  });
});
