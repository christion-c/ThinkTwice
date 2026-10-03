// Shared USD currency formatters. Two variants exist because different
// screens have always shown different precision (whole dollars for
// headline/summary figures, cents for itemized budget lines) - both are
// kept so call sites can pick the one that matches their existing output.
const currencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const wholeCurrencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// Cents-precision formatting (the Intl default for USD), e.g. "$64.20".
export function formatCurrency(value: number): string {
  return currencyFormat.format(value);
}

// Whole-dollar formatting, e.g. "$64".
export function formatCurrencyWhole(value: number): string {
  return wholeCurrencyFormat.format(value);
}
