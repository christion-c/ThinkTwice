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

interface FillUpRow {
  miles_driven: string;
  fuel_price: string;
  combined_mpg: string;
  tank_capacity: string;
  gallons: string;
  observed_cost: string;
  recorded_at: Date;
}

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

export async function insertFillUpHistory(
  userId: string,
  entry: Omit<FillUpEntry, "recordedAt">,
): Promise<void> {
  await database.query(
    `
      INSERT INTO fill_up_history (
        user_id, miles_driven, fuel_price, combined_mpg,
        tank_capacity, gallons, observed_cost
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      userId,
      entry.milesDriven,
      entry.fuelPrice,
      entry.combinedMpg,
      entry.tankCapacity,
      entry.gallons,
      entry.observedCost,
    ],
  );
}

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
