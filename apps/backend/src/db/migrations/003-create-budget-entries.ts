import type { Migration } from "./migration.types.js";

/**
 * Creates the daily budget/habit check-ins that back the finance and
 * nutrition screens, and provide training data for the ML forecast.
 */
export const createBudgetEntriesMigration: Migration = {
  id: "003_create_budget_entries",
  description: "Create the budget_entries table",

  async up(client) {
    await client.query(`
      CREATE TABLE budget_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID NOT NULL
          REFERENCES users(id)
          ON DELETE CASCADE,

        entry_date DATE NOT NULL,

        fuel_cost NUMERIC(8, 2)
          CHECK (fuel_cost IS NULL OR fuel_cost >= 0),

        food_cost NUMERIC(8, 2)
          CHECK (food_cost IS NULL OR food_cost >= 0),

        miles_driven NUMERIC(8, 2)
          CHECK (miles_driven IS NULL OR miles_driven >= 0),

        meals INTEGER
          CHECK (meals IS NULL OR meals >= 0),

        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX budget_entries_user_id_entry_date_idx
        ON budget_entries (user_id, entry_date DESC);
    `);
  },
};
