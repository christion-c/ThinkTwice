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

// Parses a typed calendar date - "10/2/2026" or "10/02/2026"
// (month/day/year, the way US pay stubs print it) - into "YYYY-MM-DD".
// Null unless it's a real date (no February 30th).
export function parseUsDate(text: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());

  if (!match) {
    return null;
  }

  const [month, day, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
