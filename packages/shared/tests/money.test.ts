import { describe, expect, it } from "vitest";

import { MAX_AMOUNT_CENTS, amountCentsSchema } from "../src/index.js";

describe("amountCentsSchema", () => {
  it("accepts positive whole cents up to the maximum", () => {
    expect(amountCentsSchema.parse(1)).toBe(1);
    expect(amountCentsSchema.parse(450)).toBe(450);
    expect(amountCentsSchema.parse(MAX_AMOUNT_CENTS)).toBe(MAX_AMOUNT_CENTS);
  });

  it.each([
    0,
    -1,
    4.5,
    MAX_AMOUNT_CENTS + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    "450",
    null,
  ])("rejects %p", (value) => {
    expect(amountCentsSchema.safeParse(value).success).toBe(false);
  });
});
