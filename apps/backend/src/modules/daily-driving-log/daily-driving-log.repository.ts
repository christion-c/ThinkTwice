import { database } from "../../db/pool.js";
import { numericOrNull } from "../../lib/db-helpers.js";

export interface DailyDrivingLog {
  id: string;
  logDate: string;
  milesDriven: number;
  vehicleId: string | null;
}

export interface CreateDailyDrivingLogInput {
  logDate: string;
  milesDriven: number;
  vehicleId?: string | null | undefined;
}

interface DailyDrivingLogRow {
  id: string;
  log_date: Date;
  miles_driven: string;
  vehicle_id: string | null;
}

// NUMERIC/DATE columns come back from the pg driver as string/Date -
// normalize both to the wire shape (YYYY-MM-DD, number).
function mapRow(row: DailyDrivingLogRow): DailyDrivingLog {
  return {
    id: row.id,
    logDate: row.log_date.toISOString().slice(0, 10),
    milesDriven: numericOrNull(row.miles_driven),
    vehicleId: row.vehicle_id,
  };
}

// Creates or corrects the given user's log for one day - re-checking in
// on the same day overwrites that day's number rather than creating a
// duplicate row, enforced by the daily_driving_logs (user_id, log_date)
// unique constraint. A given vehicleId must belong to the same user,
// checked in the same statement; returns null (writing nothing) when it
// doesn't.
export async function upsertDailyDrivingLog(
  userId: string,
  input: CreateDailyDrivingLogInput,
): Promise<DailyDrivingLog | null> {
  const result = await database.query<DailyDrivingLogRow>(
    `
      INSERT INTO daily_driving_logs (user_id, log_date, miles_driven, vehicle_id)
      SELECT $1::uuid, $2::date, $3::numeric, $4::uuid
      WHERE
        $4::uuid IS NULL
        OR EXISTS (
          SELECT 1 FROM vehicles v WHERE v.id = $4::uuid AND v.user_id = $1::uuid
        )

      ON CONFLICT (user_id, log_date)
      DO UPDATE SET
        miles_driven = EXCLUDED.miles_driven,
        vehicle_id   = EXCLUDED.vehicle_id,
        updated_at   = CURRENT_TIMESTAMP

      RETURNING id, log_date, miles_driven, vehicle_id
    `,
    [userId, input.logDate, input.milesDriven, input.vehicleId ?? null],
  );

  const log = result.rows[0];

  return log ? mapRow(log) : null;
}

// Returns the given user's most recent daily driving logs, newest first.
export async function listDailyDrivingLogsForUser(
  userId: string,
  limit = 60,
): Promise<DailyDrivingLog[]> {
  const result = await database.query<DailyDrivingLogRow>(
    `
      SELECT id, log_date, miles_driven, vehicle_id
      FROM daily_driving_logs
      WHERE user_id = $1
      ORDER BY log_date DESC
      LIMIT $2
    `,
    [userId, limit],
  );

  return result.rows.map(mapRow);
}

// Reassigns a daily driving log to a different vehicle (or unassigns it
// with null) - only when the log belongs to the given user AND, when
// vehicleId isn't null, that vehicle also belongs to the same user.
export async function updateDailyDrivingLogVehicle(
  logId: string,
  userId: string,
  vehicleId: string | null,
): Promise<DailyDrivingLog | null> {
  const result = await database.query<DailyDrivingLogRow>(
    `
      UPDATE daily_driving_logs
      SET vehicle_id = $3
      WHERE id = $1
        AND user_id = $2
        AND (
          $3::uuid IS NULL
          OR EXISTS (
            SELECT 1 FROM vehicles v WHERE v.id = $3 AND v.user_id = $2
          )
        )
      RETURNING id, log_date, miles_driven, vehicle_id
    `,
    [logId, userId, vehicleId],
  );

  const log = result.rows[0];

  return log ? mapRow(log) : null;
}

// Deletes a single daily driving log - only when it belongs to the
// given user.
export async function deleteDailyDrivingLog(
  logId: string,
  userId: string,
): Promise<boolean> {
  const result = await database.query(
    `
      DELETE FROM daily_driving_logs
      WHERE id = $1
        AND user_id = $2
    `,
    [logId, userId],
  );

  return result.rowCount === 1;
}

// Deletes every daily driving log for the given user - the "start my
// data over" bulk action. Returns how many rows were removed.
export async function deleteAllDailyDrivingLogsForUser(
  userId: string,
): Promise<number> {
  const result = await database.query(
    `
      DELETE FROM daily_driving_logs
      WHERE user_id = $1
    `,
    [userId],
  );

  return result.rowCount ?? 0;
}
