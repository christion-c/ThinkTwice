import { database } from "../../db/pool.js";
import { numericOrNull } from "../../lib/db-helpers.js";

// These field names are serialized as-is over GET /fill-up-history/internal
// and hand-remapped to snake_case on the other side by the ML service's
// _fetch_backend_history (services/ml/app/history.py) - there's no shared
// schema between the two languages, so a rename here has to be paired
// with an update there (and that function's own test,
// test_fetch_backend_history_remaps_camel_case_fields in
// services/ml/tests/test_history.py) or the ML service silently starts
// reading every field as its own 0 default instead of erroring. Adding
// new fields (id, vehicleId) is additive, not a rename, so it doesn't
// need a matching ML-side change.
export interface FillUpEntry {
  id: string;
  milesDriven: number;
  fuelPrice: number;
  combinedMpg: number;
  tankCapacity: number;
  gallons: number;
  observedCost: number;
  recordedAt: Date;
  vehicleId: string | null;
}

export type FillUpEntryInput = Omit<
  FillUpEntry,
  "id" | "recordedAt" | "vehicleId"
> & {
  recordedAt?: Date | string | null | undefined;
  vehicleId?: string | null | undefined;
};

interface FillUpRow {
  id: string;
  miles_driven: string;
  fuel_price: string;
  combined_mpg: string;
  tank_capacity: string;
  gallons: string;
  observed_cost: string;
  recorded_at: Date;
  vehicle_id: string | null;
}

// NUMERIC columns come back as strings from the pg driver - convert each to a number.
function mapRow(row: FillUpRow): FillUpEntry {
  return {
    id: row.id,
    milesDriven: numericOrNull(row.miles_driven),
    fuelPrice: numericOrNull(row.fuel_price),
    combinedMpg: numericOrNull(row.combined_mpg),
    tankCapacity: numericOrNull(row.tank_capacity),
    gallons: numericOrNull(row.gallons),
    observedCost: numericOrNull(row.observed_cost),
    recordedAt: row.recorded_at,
    vehicleId: row.vehicle_id,
  };
}

// Saves one fill-up entry for the given user. When a vehicleId is
// given, it must belong to that same user - checked in the same
// statement as the insert (like updateFillUpHistoryVehicle below), so a
// client can't attach its history to someone else's vehicle. Returns
// false, inserting nothing, when the vehicle isn't the user's.
export async function insertFillUpHistory(
  userId: string,
  entry: FillUpEntryInput,
): Promise<boolean> {
  // Default to now when the caller didn't send an explicit timestamp.
  const recordedAt = entry.recordedAt ? new Date(entry.recordedAt) : new Date();

  const result = await database.query(
    `
      INSERT INTO fill_up_history (
        user_id, miles_driven, fuel_price, combined_mpg,
        tank_capacity, gallons, observed_cost, recorded_at, vehicle_id
      )
      SELECT
        $1::uuid, $2::numeric, $3::numeric, $4::numeric,
        $5::numeric, $6::numeric, $7::numeric, $8::timestamptz, $9::uuid
      WHERE
        $9::uuid IS NULL
        OR EXISTS (
          SELECT 1 FROM vehicles v WHERE v.id = $9::uuid AND v.user_id = $1::uuid
        )
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
      entry.vehicleId ?? null,
    ],
  );

  return result.rowCount === 1;
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
        h.id, h.miles_driven, h.fuel_price, h.combined_mpg,
        h.tank_capacity, h.gallons, h.observed_cost, h.recorded_at,
        h.vehicle_id
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
        id, miles_driven, fuel_price, combined_mpg,
        tank_capacity, gallons, observed_cost, recorded_at, vehicle_id
      FROM fill_up_history
      WHERE user_id = $1
      ORDER BY recorded_at DESC
    `,
    [userId],
  );

  return result.rows.map(mapRow);
}

// Reassigns a fill-up entry to a different vehicle (or unassigns it with
// null) - only when the entry belongs to the given user AND, when
// vehicleId isn't null, that vehicle also belongs to the same user. Both
// checks happen in one statement so there's no gap between "verify
// ownership" and "apply the change."
export async function updateFillUpHistoryVehicle(
  entryId: string,
  userId: string,
  vehicleId: string | null,
): Promise<FillUpEntry | null> {
  const result = await database.query<FillUpRow>(
    `
      UPDATE fill_up_history
      SET vehicle_id = $3
      WHERE id = $1
        AND user_id = $2
        AND (
          $3::uuid IS NULL
          OR EXISTS (
            SELECT 1 FROM vehicles v WHERE v.id = $3 AND v.user_id = $2
          )
        )
      RETURNING
        id, miles_driven, fuel_price, combined_mpg,
        tank_capacity, gallons, observed_cost, recorded_at, vehicle_id
    `,
    [entryId, userId, vehicleId],
  );

  const entry = result.rows[0];

  // No row means the entry doesn't exist, belongs to someone else, or
  // the target vehicle doesn't belong to this user.
  return entry ? mapRow(entry) : null;
}

// Deletes a fill-up entry only when it belongs to the given user.
export async function deleteFillUpHistoryEntry(
  entryId: string,
  userId: string,
): Promise<boolean> {
  const result = await database.query(
    `
      DELETE FROM fill_up_history
      WHERE id = $1
        AND user_id = $2
    `,
    [entryId, userId],
  );

  // Exactly one row deleted means it existed and belonged to this user.
  return result.rowCount === 1;
}

// Deletes every fill-up entry for the given user - the "start my data
// over" bulk action. Returns how many rows were removed.
export async function deleteAllFillUpHistoryForUser(
  userId: string,
): Promise<number> {
  const result = await database.query(
    `
      DELETE FROM fill_up_history
      WHERE user_id = $1
    `,
    [userId],
  );

  return result.rowCount ?? 0;
}
