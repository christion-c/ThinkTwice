import { describe, expect, it } from "vitest";

import { isValidTimeZone, updateUserSettingsSchema } from "../src/index.js";

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
