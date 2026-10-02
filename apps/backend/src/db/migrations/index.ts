import { createUsersMigration } from "./001-create-users.js";
import { createVehiclesMigration } from "./002-create-vehicles.js";
import { createBudgetEntriesMigration } from "./003-create-budget-entries.js";
import { createFinanceInputsMigration } from "./004-create-finance-inputs.js";
import { createFillUpHistoryMigration } from "./005-create-fill-up-history.js";
import { createDailyDrivingLogsMigration } from "./006-create-daily-driving-logs.js";
import { addVehicleIdToHistoryMigration } from "./007-add-vehicle-id-to-history.js";
import { createMoneyPlanMigration } from "./008-create-money-plan.js";
import type { Migration } from "./migration.types.js";

// Every ThinkTwice database migration, in execution order. Never
// reorder, rename, or remove an already-applied migration.
export const migrations: readonly Migration[] = [
  createUsersMigration,
  createVehiclesMigration,
  createBudgetEntriesMigration,
  createFinanceInputsMigration,
  createFillUpHistoryMigration,
  createDailyDrivingLogsMigration,
  addVehicleIdToHistoryMigration,
  createMoneyPlanMigration,
];
