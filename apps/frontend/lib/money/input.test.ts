import { amountToInput, parseAmount, parseDecimal, parseUsDate } from "./input";

describe("parseAmount", () => {
  it("accepts what people type on a phone", () => {
    expect(parseAmount("$1,325.76")).toBe(1325.76);
    expect(parseAmount(" 40 ")).toBe(40);
    expect(parseAmount("14.7")).toBe(14.7);
    expect(parseAmount(".5")).toBe(0.5);
    expect(parseAmount("0")).toBe(0);
  });

  it("rejects anything that isn't a plain amount", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("12.345")).toBeNull();
    expect(parseAmount("12abc")).toBeNull();
    expect(parseAmount("1e3")).toBeNull();
    expect(parseAmount("$")).toBeNull();
  });
});

describe("parseDecimal", () => {
  it("allows up to 3 decimals and a trailing %", () => {
    expect(parseDecimal("37.5")).toBe(37.5);
    expect(parseDecimal("22.49%")).toBe(22.49);
    expect(parseDecimal("4.125")).toBe(4.125);
    expect(parseDecimal("1.2345")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
  });
});

describe("amountToInput", () => {
  it("shows whole numbers without decimals and cents with two", () => {
    expect(amountToInput(40)).toBe("40");
    expect(amountToInput(1325.7)).toBe("1325.70");
    expect(amountToInput(null)).toBe("");
  });
});

describe("parseUsDate", () => {
  it("reads month/day/year, with or without leading zeros", () => {
    expect(parseUsDate("10/2/2026")).toBe("2026-10-02");
    expect(parseUsDate(" 01/09/2025 ")).toBe("2025-01-09");
    expect(parseUsDate("2/29/2028")).toBe("2028-02-29");
  });

  it("rejects dates that don't exist and other formats", () => {
    expect(parseUsDate("2/30/2026")).toBeNull();
    expect(parseUsDate("2/29/2026")).toBeNull();
    expect(parseUsDate("13/1/2026")).toBeNull();
    expect(parseUsDate("2026-10-02")).toBeNull();
    expect(parseUsDate("10/2/26")).toBeNull();
    expect(parseUsDate("")).toBeNull();
  });
});
