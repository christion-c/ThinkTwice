import { createUsersMigration } from "./001-create-users.js";
import { createVehiclesMigration } from "./002-create-vehicles.js";
import { createBudgetEntriesMigration } from "./003-create-budget-entries.js";
import { createFinanceInputsMigration } from "./004-create-finance-inputs.js";
import { createFillUpHistoryMigration } from "./005-create-fill-up-history.js";
import type { Migration } from "./migration.types.js";

/**
 * Contains every ThinkTwice database migration in execution order.
 *
 * Never reorder, rename, or remove an applied migration.
 */
export const migrations: readonly Migration[] = [
  createUsersMigration,
  createVehiclesMigration,
  createBudgetEntriesMigration,
  createFinanceInputsMigration,
  createFillUpHistoryMigration,
];
