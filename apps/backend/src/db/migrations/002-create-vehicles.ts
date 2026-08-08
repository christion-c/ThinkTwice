import type { Migration } from "./migration.types.js";

/**
 * Creates user-owned vehicle profiles for fuel calculations and tracking.
 */
export const createVehiclesMigration: Migration = {
  id: "002_create_vehicles",
  description: "Create the vehicles table",

  async up(client) {
    await client.query(`
      CREATE TABLE vehicles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID NOT NULL
          REFERENCES users(id)
          ON DELETE CASCADE,

        nickname TEXT NOT NULL
          CHECK (char_length(nickname) BETWEEN 1 AND 50),

        make TEXT
          CHECK (make IS NULL OR char_length(make) <= 100),

        model TEXT
          CHECK (model IS NULL OR char_length(model) <= 100),

        model_year INTEGER
          CHECK (model_year IS NULL OR model_year BETWEEN 1886 AND 2200),

        tank_capacity_gallons NUMERIC(6, 2)
          CHECK (
            tank_capacity_gallons IS NULL
            OR tank_capacity_gallons > 0
          ),

        combined_mpg NUMERIC(6, 2)
          CHECK (
            combined_mpg IS NULL
            OR combined_mpg > 0
          ),

        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX vehicles_user_id_idx
        ON vehicles (user_id);
    `);
  },
};