import { describe, expect, it } from "vitest";

import {
  createAccountSchema,
  isValidTimeZone,
  updateUserSettingsSchema,
} from "../src/index.js";

describe("isValidTimeZone", () => {
  it.each(["America/Chicago", "Europe/London", "UTC"])(
    "accepts %p",
    (timeZone) => {
      expect(isValidTimeZone(timeZone)).toBe(true);
    },
  );

  it.each(["Mars/Olympus_Mons", "not a zone", ""])("rejects %p", (timeZone) => {
    expect(isValidTimeZone(timeZone)).toBe(false);
  });
});

describe("updateUserSettingsSchema", () => {
  it("accepts a time zone", () => {
    expect(
      updateUserSettingsSchema.parse({ timezone: "America/Chicago" }),
    ).toEqual({ timezone: "America/Chicago" });
  });

  it("accepts setting and clearing the monthly budget", () => {
    expect(
      updateUserSettingsSchema.parse({ monthlyBudgetCents: 200_000 }),
    ).toEqual({ monthlyBudgetCents: 200_000 });
    expect(
      updateUserSettingsSchema.parse({ monthlyBudgetCents: null }),
    ).toEqual({ monthlyBudgetCents: null });
  });

  it("rejects an invalid time zone or budget", () => {
    expect(
      updateUserSettingsSchema.safeParse({ timezone: "Mars/Olympus_Mons" })
        .success,
    ).toBe(false);
    expect(
      updateUserSettingsSchema.safeParse({ monthlyBudgetCents: 0 }).success,
    ).toBe(false);
  });

  it("rejects an empty update and unknown fields such as email", () => {
    expect(updateUserSettingsSchema.safeParse({}).success).toBe(false);
    expect(
      updateUserSettingsSchema.safeParse({ email: "someone@example.com" })
        .success,
    ).toBe(false);
  });
});

describe("createAccountSchema", () => {
  it("accepts a time zone", () => {
    expect(createAccountSchema.parse({ timezone: "America/Chicago" })).toEqual({
      timezone: "America/Chicago",
    });
  });

  it("rejects a missing or invalid time zone", () => {
    expect(createAccountSchema.safeParse({}).success).toBe(false);
    expect(
      createAccountSchema.safeParse({ timezone: "Mars/Olympus_Mons" }).success,
    ).toBe(false);
  });

  it("rejects unknown fields such as a client-supplied email or user ID", () => {
    expect(
      createAccountSchema.safeParse({
        timezone: "UTC",
        email: "someone@example.com",
      }).success,
    ).toBe(false);
    expect(
      createAccountSchema.safeParse({
        timezone: "UTC",
        userId: "0199f3c2-7c1e-7a3b-9d2e-1234567890ab",
      }).success,
    ).toBe(false);
  });
});
