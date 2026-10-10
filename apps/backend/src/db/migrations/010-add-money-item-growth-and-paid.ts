import type { Migration } from "./migration.types.js";

// Two money_items additions:
//
// - growth_percent: an asset's yearly growth, compounded monthly from
//   balance_as_of - positive for savings interest or investments,
//   negative for a car's depreciation. NULL = the value stays flat. Its
//   own column rather than reusing apr_percent, whose CHECK (0-100)
//   doesn't allow a negative rate.
// - balance_after_payment: the debt balance entered already has that
//   month's payment taken out, so the schedule skips the payment in the
//   balance_as_of month instead of taking it out again.
export const addMoneyItemGrowthAndPaidMigration: Migration = {
  id: "010_add_money_item_growth_and_paid",
  description: "Add growth_percent and balance_after_payment to money_items",

  async up(client) {
    await client.query(`
      ALTER TABLE money_items
        ADD COLUMN growth_percent NUMERIC(6, 3)
          CHECK (growth_percent IS NULL OR (growth_percent >= -100 AND growth_percent <= 100)),

        ADD COLUMN balance_after_payment BOOLEAN NOT NULL DEFAULT false;
    `);
  },
};
