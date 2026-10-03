import type { Migration } from "./migration.types.js";

// Paychecks as actually received. The pay profile (pay_profiles) is
// only an estimate of a normal check; hours and take-home change week
// to week, so each logged check replaces one estimated check in its
// month. Gross is optional - not everyone has the pay stub handy.
//
// Money is NUMERIC, never float or text, so totals stay exact to the cent.
export const createPaychecksMigration: Migration = {
  id: "009_create_paychecks",
  description: "Create paychecks table",

  async up(client) {
    await client.query(`
      CREATE TABLE paychecks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID NOT NULL
          REFERENCES users(id)
          ON DELETE CASCADE,

        paid_on DATE NOT NULL,

        take_home NUMERIC(12, 2) NOT NULL
          CHECK (take_home >= 0),

        gross NUMERIC(12, 2)
          CHECK (gross IS NULL OR gross >= 0),

        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX paychecks_user_id_paid_on_idx ON paychecks (user_id, paid_on DESC);
    `);
  },
};
