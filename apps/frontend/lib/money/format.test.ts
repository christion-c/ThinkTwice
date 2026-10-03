import { formatCurrency, formatCurrencyWhole } from "./format";

describe("formatCurrency", () => {
  it("formats a typical positive value with cents precision", () => {
    expect(formatCurrency(64.2)).toBe("$64.20");
  });

  it("rounds to the nearest cent", () => {
    expect(formatCurrency(19.995)).toBe("$20.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative values with a leading minus sign", () => {
    expect(formatCurrency(-42.5)).toBe("-$42.50");
  });

  it("formats large values with thousands separators", () => {
    expect(formatCurrency(1234567.89)).toBe("$1,234,567.89");
  });
});

describe("formatCurrencyWhole", () => {
  it("formats a typical positive value with no decimal places", () => {
    expect(formatCurrencyWhole(64.2)).toBe("$64");
  });

  it("rounds fractional cents to the nearest whole dollar", () => {
    expect(formatCurrencyWhole(64.5)).toBe("$65");
    expect(formatCurrencyWhole(64.49)).toBe("$64");
  });

  it("formats zero", () => {
    expect(formatCurrencyWhole(0)).toBe("$0");
  });

  it("formats negative values with a leading minus sign", () => {
    expect(formatCurrencyWhole(-42.5)).toBe("-$43");
  });
});
