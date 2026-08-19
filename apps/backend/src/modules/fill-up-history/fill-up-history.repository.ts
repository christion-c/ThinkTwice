import { database } from "../../db/pool.js";

export interface FillUpEntry {
  milesDriven: number;
  fuelPrice: number;
  combinedMpg: number;
  tankCapacity: number;
  gallons: number;
  observedCost: number;
  recordedAt: Date;
}

export type FillUpEntryInput = Omit<FillUpEntry, "recordedAt"> & {
  recordedAt?: Date | string | null;
};

interface FillUpRow {
  miles_driven: string;
  fuel_price: string;
  combined_mpg: string;
  tank_capacity: string;
  gallons: string;
  observed_cost: string;
  recorded_at: Date;
}

// NUMERIC columns come back as strings from the pg driver - convert each to a number.
function mapRow(row: FillUpRow): FillUpEntry {
  return {
    milesDriven: Number(row.miles_driven),
    fuelPrice: Number(row.fuel_price),
    combinedMpg: Number(row.combined_mpg),
    tankCapacity: Number(row.tank_capacity),
    gallons: Number(row.gallons),
    observedCost: Number(row.observed_cost),
    recordedAt: row.recorded_at,
  };
}

// Saves one fill-up entry for the given user.
export async function insertFillUpHistory(
  userId: string,
  entry: FillUpEntryInput,
): Promise<void> {
  // Default to now when the caller didn't send an explicit timestamp.
  const recordedAt = entry.recordedAt ? new Date(entry.recordedAt) : new Date();

  await database.query(
    `
      INSERT INTO fill_up_history (
        user_id, miles_driven, fuel_price, combined_mpg,
        tank_capacity, gallons, observed_cost, recorded_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      userId,
      entry.milesDriven,
      entry.fuelPrice,
      entry.combinedMpg,
      entry.tankCapacity,
      entry.gallons,
      entry.observedCost,
      recordedAt,
    ],
  );
}

// Same data as listFillUpHistoryByUserId, keyed by Firebase UID instead
// of the internal user id. Exists for the ML service's internal-only
// route (see fill-up-history.routes.ts's GET /internal), which only has
// the Firebase UID on hand and has no reason to resolve it to a
// Postgres user row first.
export async function listFillUpHistoryByFirebaseUid(
  firebaseUid: string,
): Promise<FillUpEntry[]> {
  const result = await database.query<FillUpRow>(
    `
      SELECT
        h.miles_driven, h.fuel_price, h.combined_mpg,
        h.tank_capacity, h.gallons, h.observed_cost, h.recorded_at
      FROM fill_up_history h
      JOIN users u ON u.id = h.user_id
      WHERE u.firebase_uid = $1
      ORDER BY h.recorded_at DESC
    `,
    [firebaseUid],
  );

  return result.rows.map(mapRow);
}

// Returns fill-up history for the given user, newest first.
export async function listFillUpHistoryByUserId(
  userId: string,
): Promise<FillUpEntry[]> {
  const result = await database.query<FillUpRow>(
    `
      SELECT
        miles_driven, fuel_price, combined_mpg,
        tank_capacity, gallons, observed_cost, recorded_at
      FROM fill_up_history
      WHERE user_id = $1
      ORDER BY recorded_at DESC
    `,
    [userId],
  );

  return result.rows.map(mapRow);
}
