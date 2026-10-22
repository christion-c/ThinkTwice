import { describe, expect, it } from "vitest";

import { monthContaining, todayIn } from "../src/index.js";

// 2026-10-22 03:30 UTC: still the 21st in Chicago, already the 22nd in Tokyo.
const EARLY_UTC = new Date("2026-10-22T03:30:00Z");

describe("todayIn", () => {
  it("uses the given time zone's calendar date", () => {
    expect(todayIn("UTC", EARLY_UTC)).toBe("2026-10-22");
    expect(todayIn("America/Chicago", EARLY_UTC)).toBe("2026-10-21");
    expect(todayIn("Asia/Tokyo", EARLY_UTC)).toBe("2026-10-22");
  });

  it("pads months and days to two digits", () => {
    expect(todayIn("UTC", new Date("2026-03-05T12:00:00Z"))).toBe("2026-03-05");
  });
});

describe("monthContaining", () => {
  it.each([
    ["2026-10-22", "2026-10-01", "2026-10-31"],
    ["2026-02-10", "2026-02-01", "2026-02-28"],
    ["2028-02-10", "2028-02-01", "2028-02-29"],
    ["2026-12-31", "2026-12-01", "2026-12-31"],
    ["2026-04-01", "2026-04-01", "2026-04-30"],
  ])("%s is in the month %s to %s", (date, from, to) => {
    expect(monthContaining(date)).toEqual({ from, to });
  });
});
