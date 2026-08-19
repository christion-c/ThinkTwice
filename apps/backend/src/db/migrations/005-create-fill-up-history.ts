import type { Migration } from "./migration.types.js";

// Creates per-fill-up fuel records, backing both the fuel forecast on
// the Fuel screen and the ML service's /ml-preview debug endpoint (see
// services/ml/app/history.py).
export const createFillUpHistoryMigration: Migration = {
  id: "005_create_fill_up_history",
  description: "Create the fill_up_history table",

  async up(client) {
    await client.query(`
      CREATE TABLE fill_up_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID NOT NULL
          REFERENCES users(id)
          ON DELETE CASCADE,

        miles_driven NUMERIC(10, 2) NOT NULL DEFAULT 0,
        fuel_price   NUMERIC(10, 4) NOT NULL DEFAULT 0,
        combined_mpg NUMERIC(10, 2) NOT NULL DEFAULT 0,
        tank_capacity NUMERIC(10, 2) NOT NULL DEFAULT 0,
        gallons      NUMERIC(10, 4) NOT NULL DEFAULT 0,
        observed_cost NUMERIC(10, 4) NOT NULL DEFAULT 0,

        recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX fill_up_history_user_id_idx
        ON fill_up_history (user_id);
    `);
  },
};
