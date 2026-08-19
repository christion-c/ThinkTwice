import type { Migration } from "./migration.types.js";

// Creates a single-row-per-user table for persisted finance planner
// inputs. All values are stored as TEXT to mirror the string-based
// form state on the frontend - an empty string means "not entered yet".
export const createFinanceInputsMigration: Migration = {
  id: "004_create_finance_inputs",
  description: "Create the finance_inputs table",

  async up(client) {
    await client.query(`
      CREATE TABLE finance_inputs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID NOT NULL UNIQUE
          REFERENCES users(id)
          ON DELETE CASCADE,

        income_input TEXT NOT NULL DEFAULT ''
          CHECK (char_length(income_input) <= 30),

        expense_input TEXT NOT NULL DEFAULT ''
          CHECK (char_length(expense_input) <= 30),

        monthly_fixed_costs_input TEXT NOT NULL DEFAULT ''
          CHECK (char_length(monthly_fixed_costs_input) <= 30),

        fuel_gallons_input TEXT NOT NULL DEFAULT ''
          CHECK (char_length(fuel_gallons_input) <= 30),

        fuel_price_input TEXT NOT NULL DEFAULT ''
          CHECK (char_length(fuel_price_input) <= 30),

        miles_per_week_input TEXT NOT NULL DEFAULT ''
          CHECK (char_length(miles_per_week_input) <= 30),

        combined_mpg_input TEXT NOT NULL DEFAULT ''
          CHECK (char_length(combined_mpg_input) <= 30),

        tank_capacity_input TEXT NOT NULL DEFAULT ''
          CHECK (char_length(tank_capacity_input) <= 30),

        current_tank_percent_input TEXT NOT NULL DEFAULT ''
          CHECK (char_length(current_tank_percent_input) <= 30),

        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  },
};
