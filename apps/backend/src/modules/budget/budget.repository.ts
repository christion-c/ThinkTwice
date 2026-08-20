import { database } from "../../db/pool.js";
import { expectOneRow, numericOrNull } from "../../lib/db-helpers.js";

export interface CreateBudgetEntryInput {
  userId: string;
  entryDate: string;
  fuelCost: number | null;
  foodCost: number | null;
  milesDriven: number | null;
  meals: number | null;
}

export interface BudgetEntry {
  id: string;
  userId: string;
  entryDate: string;
  fuelCost: number | null;
  foodCost: number | null;
  milesDriven: number | null;
  meals: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface BudgetEntryRow {
  id: string;
  user_id: string;
  entry_date: string;
  fuel_cost: string | null;
  food_cost: string | null;
  miles_driven: string | null;
  meals: number | null;
  created_at: Date;
  updated_at: Date;
}

// Converts a PostgreSQL budget entry row into the application's format.
function mapBudgetEntryRow(row: BudgetEntryRow): BudgetEntry {
  return {
    id: row.id,
    userId: row.user_id,
    entryDate: row.entry_date,
    // NUMERIC columns come back as strings from the pg driver.
    fuelCost: numericOrNull(row.fuel_cost),
    foodCost: numericOrNull(row.food_cost),
    milesDriven: numericOrNull(row.miles_driven),
    // meals is already an INTEGER column, no conversion needed.
    meals: row.meals,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Creates a budget/habit check-in owned by the authenticated user.
export async function createBudgetEntry(
  input: CreateBudgetEntryInput,
): Promise<BudgetEntry> {
  const result = await database.query<BudgetEntryRow>(
    `
      INSERT INTO budget_entries (
        user_id,
        entry_date,
        fuel_cost,
        food_cost,
        miles_driven,
        meals
      )
      VALUES ($1, $2, $3, $4, $5, $6)

      RETURNING
        id,
        user_id,
        entry_date::text,
        fuel_cost,
        food_cost,
        miles_driven,
        meals,
        created_at,
        updated_at
    `,
    [
      input.userId,
      input.entryDate,
      input.fuelCost,
      input.foodCost,
      input.milesDriven,
      input.meals,
    ],
  );

  const entry = expectOneRow(result, "created budget entry");

  return mapBudgetEntryRow(entry);
}

// Returns the most recent budget entries belonging to the specified
// user, newest first.
export async function listBudgetEntriesForUser(
  userId: string,
  limit: number,
): Promise<BudgetEntry[]> {
  const result = await database.query<BudgetEntryRow>(
    `
      SELECT
        id,
        user_id,
        entry_date::text,
        fuel_cost,
        food_cost,
        miles_driven,
        meals,
        created_at,
        updated_at
      FROM budget_entries
      WHERE user_id = $1
      ORDER BY entry_date DESC, created_at DESC
      LIMIT $2
    `,
    [userId, limit],
  );

  return result.rows.map(mapBudgetEntryRow);
}

// Deletes a budget entry only when it belongs to the specified user.
export async function deleteBudgetEntryForUser(
  entryId: string,
  userId: string,
): Promise<boolean> {
  const result = await database.query(
    `
      DELETE FROM budget_entries
      WHERE id = $1
        AND user_id = $2
    `,
    [entryId, userId],
  );

  // Exactly one row deleted means it existed and belonged to this user.
  return result.rowCount === 1;
}
