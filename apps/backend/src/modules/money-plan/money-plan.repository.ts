import { database } from "../../db/pool.js";
import { expectOneRow, numericOrNull } from "../../lib/db-helpers.js";

export type PayFrequency = "weekly" | "biweekly" | "semimonthly" | "monthly";
export type MoneyItemKind = "bill" | "loan" | "card" | "collection" | "asset";

export interface PayProfile {
  hourlyRate: number;
  hoursPerWeek: number;
  payFrequency: PayFrequency;
  takeHomePerCheck: number;
}

export interface MoneyItem {
  id: string;
  kind: MoneyItemKind;
  name: string;
  // A bill's monthly cost or a debt's monthly payment; 0 for assets.
  monthlyAmount: number;
  // A debt's balance owed or an asset's value; null for bills.
  balance: number | null;
  // YYYY-MM-DD the balance was entered (see the migration's comment).
  balanceAsOf: string | null;
  aprPercent: number | null;
  // YYYY-MM-01 of the first payment month, or null if already paying.
  startsOn: string | null;
  fromPaycheck: boolean;
}

// Everything but the id - what a create or full replace writes.
export type MoneyItemInput = Omit<MoneyItem, "id">;

interface PayProfileRow {
  hourly_rate: string;
  hours_per_week: string;
  pay_frequency: PayFrequency;
  take_home_per_check: string;
}

interface MoneyItemRow {
  id: string;
  kind: MoneyItemKind;
  name: string;
  monthly_amount: string;
  balance: string | null;
  balance_as_of: string | null;
  apr_percent: string | null;
  starts_on: string | null;
  from_paycheck: boolean;
}

function mapPayRow(row: PayProfileRow): PayProfile {
  return {
    hourlyRate: numericOrNull(row.hourly_rate),
    hoursPerWeek: numericOrNull(row.hours_per_week),
    payFrequency: row.pay_frequency,
    takeHomePerCheck: numericOrNull(row.take_home_per_check),
  };
}

function mapItemRow(row: MoneyItemRow): MoneyItem {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    monthlyAmount: numericOrNull(row.monthly_amount),
    balance: numericOrNull(row.balance),
    balanceAsOf: row.balance_as_of,
    aprPercent: numericOrNull(row.apr_percent),
    startsOn: row.starts_on,
    fromPaycheck: row.from_paycheck,
  };
}

// DATE columns are selected as ::text (YYYY-MM-DD) rather than letting
// the pg driver build a JS Date, which it does in the server's time
// zone and can shift a date across a month boundary.
const ITEM_COLUMNS = `
  id, kind, name, monthly_amount, balance,
  balance_as_of::text AS balance_as_of,
  apr_percent,
  starts_on::text AS starts_on,
  from_paycheck
`;

// Returns the user's pay profile, or null if they haven't set one up.
export async function getPayProfileForUser(userId: string): Promise<PayProfile | null> {
  const result = await database.query<PayProfileRow>(
    `
      SELECT hourly_rate, hours_per_week, pay_frequency, take_home_per_check
      FROM pay_profiles
      WHERE user_id = $1
    `,
    [userId],
  );

  return result.rows[0] ? mapPayRow(result.rows[0]) : null;
}

// Creates or replaces the user's pay profile (one row per user).
export async function upsertPayProfileForUser(
  userId: string,
  pay: PayProfile,
): Promise<PayProfile> {
  const result = await database.query<PayProfileRow>(
    `
      INSERT INTO pay_profiles (
        user_id, hourly_rate, hours_per_week, pay_frequency, take_home_per_check
      )
      VALUES ($1, $2, $3, $4, $5)

      ON CONFLICT (user_id)
      DO UPDATE SET
        hourly_rate         = EXCLUDED.hourly_rate,
        hours_per_week      = EXCLUDED.hours_per_week,
        pay_frequency       = EXCLUDED.pay_frequency,
        take_home_per_check = EXCLUDED.take_home_per_check,
        updated_at          = CURRENT_TIMESTAMP

      RETURNING hourly_rate, hours_per_week, pay_frequency, take_home_per_check
    `,
    [userId, pay.hourlyRate, pay.hoursPerWeek, pay.payFrequency, pay.takeHomePerCheck],
  );

  return mapPayRow(expectOneRow(result, "upserted pay profile"));
}

// Returns only the given user's money items, oldest first (the order
// they were added, which is the order the app lists them in).
export async function listMoneyItemsForUser(userId: string): Promise<MoneyItem[]> {
  const result = await database.query<MoneyItemRow>(
    `
      SELECT ${ITEM_COLUMNS}
      FROM money_items
      WHERE user_id = $1
      ORDER BY created_at ASC, id ASC
    `,
    [userId],
  );

  return result.rows.map(mapItemRow);
}

// Counts the user's items - used to cap how many one account can create.
export async function countMoneyItemsForUser(userId: string): Promise<number> {
  const result = await database.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM money_items WHERE user_id = $1",
    [userId],
  );

  return Number(result.rows[0]?.count ?? 0);
}

// Creates a money item owned by the given user.
export async function createMoneyItem(userId: string, input: MoneyItemInput): Promise<MoneyItem> {
  const result = await database.query<MoneyItemRow>(
    `
      INSERT INTO money_items (
        user_id, kind, name, monthly_amount, balance, balance_as_of,
        apr_percent, starts_on, from_paycheck
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING ${ITEM_COLUMNS}
    `,
    [
      userId,
      input.kind,
      input.name,
      input.monthlyAmount,
      input.balance,
      input.balanceAsOf,
      input.aprPercent,
      input.startsOn,
      input.fromPaycheck,
    ],
  );

  return mapItemRow(expectOneRow(result, "created money item"));
}

// Replaces a money item's fields - only when it belongs to the given
// user. Returns null when it doesn't exist or isn't theirs.
export async function replaceMoneyItemForUser(
  itemId: string,
  userId: string,
  input: MoneyItemInput,
): Promise<MoneyItem | null> {
  const result = await database.query<MoneyItemRow>(
    `
      UPDATE money_items
      SET
        kind           = $3,
        name           = $4,
        monthly_amount = $5,
        balance        = $6,
        balance_as_of  = $7,
        apr_percent    = $8,
        starts_on      = $9,
        from_paycheck  = $10,
        updated_at     = CURRENT_TIMESTAMP
      WHERE id = $1
        AND user_id = $2
      RETURNING ${ITEM_COLUMNS}
    `,
    [
      itemId,
      userId,
      input.kind,
      input.name,
      input.monthlyAmount,
      input.balance,
      input.balanceAsOf,
      input.aprPercent,
      input.startsOn,
      input.fromPaycheck,
    ],
  );

  const item = result.rows[0];

  return item ? mapItemRow(item) : null;
}

// Deletes a money item only when it belongs to the given user.
export async function deleteMoneyItemForUser(itemId: string, userId: string): Promise<boolean> {
  const result = await database.query(
    `
      DELETE FROM money_items
      WHERE id = $1
        AND user_id = $2
    `,
    [itemId, userId],
  );

  return result.rowCount === 1;
}
