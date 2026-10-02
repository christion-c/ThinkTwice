import type { Migration } from "./migration.types.js";

// The detailed money plan that replaces the old three-number budget
// check-in (finance_inputs' income/expense/fixed-cost columns are left
// in place - migrations are append-only and the fuel columns there are
// still live):
//
// - pay_profiles: one row per user - hourly pay, hours, pay frequency,
//   and take-home per paycheck (which already reflects every deduction,
//   so no tax/deduction questions are needed).
// - money_items: the user's bills, debts (loan/card/collection), and
//   assets in one table, distinguished by kind.
//
// Money is NUMERIC, never float or text, so totals stay exact to the cent.
export const createMoneyPlanMigration: Migration = {
  id: "008_create_money_plan",
  description: "Create pay_profiles and money_items tables",

  async up(client) {
    await client.query(`
      CREATE TABLE pay_profiles (
        user_id UUID PRIMARY KEY
          REFERENCES users(id)
          ON DELETE CASCADE,

        hourly_rate NUMERIC(10, 2) NOT NULL
          CHECK (hourly_rate >= 0),

        hours_per_week NUMERIC(5, 2) NOT NULL
          CHECK (hours_per_week >= 0 AND hours_per_week <= 168),

        pay_frequency TEXT NOT NULL
          CHECK (pay_frequency IN ('weekly', 'biweekly', 'semimonthly', 'monthly')),

        take_home_per_check NUMERIC(12, 2) NOT NULL
          CHECK (take_home_per_check >= 0),

        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE money_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID NOT NULL
          REFERENCES users(id)
          ON DELETE CASCADE,

        kind TEXT NOT NULL
          CHECK (kind IN ('bill', 'loan', 'card', 'collection', 'asset')),

        name TEXT NOT NULL
          CHECK (char_length(name) BETWEEN 1 AND 60),

        -- Monthly amount: a bill's cost or a debt's payment. 0 for assets.
        monthly_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
          CHECK (monthly_amount >= 0),

        -- A debt's balance owed, or an asset's value. NULL for bills.
        balance NUMERIC(14, 2)
          CHECK (balance IS NULL OR balance >= 0),

        -- The day balance was last entered. Payment schedules run forward
        -- from this month, so a balance entered in October is still
        -- projected correctly when viewed in December.
        balance_as_of DATE,

        apr_percent NUMERIC(6, 3)
          CHECK (apr_percent IS NULL OR (apr_percent >= 0 AND apr_percent <= 100)),

        -- First month a debt's payments begin (stored as that month's 1st),
        -- for debts that are deferred until later. NULL = already paying.
        starts_on DATE
          CHECK (starts_on IS NULL OR EXTRACT(DAY FROM starts_on) = 1),

        -- Debt is deducted from the paycheck (e.g. a 401K loan): already
        -- reflected in take-home pay, so it's not a separate bill.
        from_paycheck BOOLEAN NOT NULL DEFAULT false,

        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX money_items_user_id_idx ON money_items (user_id);
    `);
  },
};
