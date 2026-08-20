import { database } from "../../db/pool.js";
import { expectOneRow } from "../../lib/db-helpers.js";

export interface FinanceInputs {
  incomeInput: string;
  expenseInput: string;
  monthlyFixedCostsInput: string;
  fuelGallonsInput: string;
  fuelPriceInput: string;
  milesPerWeekInput: string;
  combinedMpgInput: string;
  tankCapacityInput: string;
  currentTankPercentInput: string;
}

interface FinanceInputsRow {
  income_input: string;
  expense_input: string;
  monthly_fixed_costs_input: string;
  fuel_gallons_input: string;
  fuel_price_input: string;
  miles_per_week_input: string;
  combined_mpg_input: string;
  tank_capacity_input: string;
  current_tank_percent_input: string;
}

// Converts snake_case Postgres columns into the app's camelCase shape.
function mapRow(row: FinanceInputsRow): FinanceInputs {
  return {
    incomeInput: row.income_input,
    expenseInput: row.expense_input,
    monthlyFixedCostsInput: row.monthly_fixed_costs_input,
    fuelGallonsInput: row.fuel_gallons_input,
    fuelPriceInput: row.fuel_price_input,
    milesPerWeekInput: row.miles_per_week_input,
    combinedMpgInput: row.combined_mpg_input,
    tankCapacityInput: row.tank_capacity_input,
    currentTankPercentInput: row.current_tank_percent_input,
  };
}

// Returned when a user has never saved finance inputs yet.
const EMPTY_INPUTS: FinanceInputs = {
  incomeInput: "",
  expenseInput: "",
  monthlyFixedCostsInput: "",
  fuelGallonsInput: "",
  fuelPriceInput: "",
  milesPerWeekInput: "",
  combinedMpgInput: "",
  tankCapacityInput: "",
  currentTankPercentInput: "",
};

// Reads the given user's saved finance inputs, or the empty defaults if none exist.
export async function getFinanceInputsForUser(
  userId: string,
): Promise<FinanceInputs> {
  const result = await database.query<FinanceInputsRow>(
    `
      SELECT
        income_input,
        expense_input,
        monthly_fixed_costs_input,
        fuel_gallons_input,
        fuel_price_input,
        miles_per_week_input,
        combined_mpg_input,
        tank_capacity_input,
        current_tank_percent_input
      FROM finance_inputs
      WHERE user_id = $1
    `,
    [userId],
  );

  return result.rows[0] ? mapRow(result.rows[0]) : EMPTY_INPUTS;
}

// Creates or replaces the given user's finance inputs (one row per user).
export async function upsertFinanceInputsForUser(
  userId: string,
  inputs: FinanceInputs,
): Promise<FinanceInputs> {
  const result = await database.query<FinanceInputsRow>(
    `
      INSERT INTO finance_inputs (
        user_id,
        income_input,
        expense_input,
        monthly_fixed_costs_input,
        fuel_gallons_input,
        fuel_price_input,
        miles_per_week_input,
        combined_mpg_input,
        tank_capacity_input,
        current_tank_percent_input
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)

      ON CONFLICT (user_id)
      DO UPDATE SET
        income_input                = EXCLUDED.income_input,
        expense_input               = EXCLUDED.expense_input,
        monthly_fixed_costs_input   = EXCLUDED.monthly_fixed_costs_input,
        fuel_gallons_input          = EXCLUDED.fuel_gallons_input,
        fuel_price_input            = EXCLUDED.fuel_price_input,
        miles_per_week_input        = EXCLUDED.miles_per_week_input,
        combined_mpg_input          = EXCLUDED.combined_mpg_input,
        tank_capacity_input         = EXCLUDED.tank_capacity_input,
        current_tank_percent_input  = EXCLUDED.current_tank_percent_input,
        updated_at                  = CURRENT_TIMESTAMP

      RETURNING
        income_input,
        expense_input,
        monthly_fixed_costs_input,
        fuel_gallons_input,
        fuel_price_input,
        miles_per_week_input,
        combined_mpg_input,
        tank_capacity_input,
        current_tank_percent_input
    `,
    [
      userId,
      inputs.incomeInput,
      inputs.expenseInput,
      inputs.monthlyFixedCostsInput,
      inputs.fuelGallonsInput,
      inputs.fuelPriceInput,
      inputs.milesPerWeekInput,
      inputs.combinedMpgInput,
      inputs.tankCapacityInput,
      inputs.currentTankPercentInput,
    ],
  );

  const row = expectOneRow(result, "upserted finance inputs");

  return mapRow(row);
}
