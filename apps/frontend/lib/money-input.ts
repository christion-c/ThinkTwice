// Parsing for amounts typed into the money plan's forms. Accepts what
// people naturally type on a phone - "$1,325.76", "40", " 14.7 " -
// and rejects anything that isn't a plain non-negative amount, rather
// than guessing (accuracy beats convenience for money).

const AMOUNT_PATTERN = /^\d+(\.\d{0,2})?$|^\.\d{1,2}$/;

// Returns the amount, or null if the text isn't a valid amount with at
// most 2 decimal places.
export function parseAmount(text: string): number | null {
  const cleaned = text.trim().replace(/^\$/, "").replace(/,/g, "");

  if (!AMOUNT_PATTERN.test(cleaned)) {
    return null;
  }

  return Math.round(Number(cleaned) * 100) / 100;
}

// Like parseAmount, but for hours/percentages that may have more
// precision (e.g. 37.5 hours, 22.49% APR). Up to 3 decimals.
export function parseDecimal(text: string): number | null {
  const cleaned = text.trim().replace(/%$/, "");

  if (!/^\d+(\.\d{0,3})?$|^\.\d{1,3}$/.test(cleaned)) {
    return null;
  }

  return Number(cleaned);
}

// Formats a stored amount for an input field: "1325.76", "40" (no
// trailing ".00" for whole numbers, so editing feels natural).
export function amountToInput(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
