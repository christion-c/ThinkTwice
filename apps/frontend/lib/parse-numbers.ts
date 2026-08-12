/**
 * Parses a form-input string into a number, or null for blank/invalid input.
 * Used wherever a numeric field is optional (e.g. omitted budget-entry costs).
 */
export function parseOptionalNumber(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number.parseFloat(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

/**
 * Same as parseOptionalNumber but truncates to an integer (e.g. meal counts).
 */
export function parseOptionalInt(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number.parseInt(trimmedValue, 10);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}
