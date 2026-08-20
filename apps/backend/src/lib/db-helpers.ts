// Returns the single row from a query result that should always yield
// exactly one row (e.g. `INSERT ... RETURNING`), or throws with a
// message naming what was expected - repositories call this rather
// than repeating the same "should always yield exactly one row" guard
// after every such query.
export function expectOneRow<T>(
  result: { rows: T[] },
  entityName: string,
): T {
  const row = result.rows[0];

  if (!row) {
    throw new Error(`PostgreSQL did not return the ${entityName}.`);
  }

  return row;
}

// NUMERIC columns come back from the pg driver as strings (to avoid
// silent precision loss); converts one to a number, preserving null
// rather than coercing it to 0. Overloaded so a non-nullable NUMERIC
// column (typed `string`) converts to a plain `number`, while a
// nullable one (typed `string | null`) keeps `null` in its type.
export function numericOrNull(value: string): number;
export function numericOrNull(value: string | null): number | null;
export function numericOrNull(value: string | null): number | null {
  return value === null ? null : Number(value);
}
