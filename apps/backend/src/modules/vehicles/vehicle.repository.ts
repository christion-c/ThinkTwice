import { database } from "../../db/pool.js";

export interface CreateVehicleInput {
  userId: string;
  nickname: string;
  make: string | null;
  model: string | null;
  modelYear: number | null;
  tankCapacityGallons: number | null;
  combinedMpg: number | null;
}

export interface UpdateVehicleInput {
  vehicleId: string;
  userId: string;
  // `| undefined` (not just optional) on every field below because this
  // gets built from zod's .partial() output, which types omitted fields
  // as `T | undefined` rather than as truly absent — even though zod
  // never actually assigns undefined at runtime, only omits the key.
  // hasOwnProperty() in updateVehicleForUser is what actually matters.
  nickname?: string | undefined;
  make?: string | null | undefined;
  model?: string | null | undefined;
  modelYear?: number | null | undefined;
  tankCapacityGallons?: number | null | undefined;
  combinedMpg?: number | null | undefined;
}

export interface Vehicle {
  id: string;
  userId: string;
  nickname: string;
  make: string | null;
  model: string | null;
  modelYear: number | null;
  tankCapacityGallons: number | null;
  combinedMpg: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface VehicleRow {
  id: string;
  user_id: string;
  nickname: string;
  make: string | null;
  model: string | null;
  model_year: number | null;
  tank_capacity_gallons: string | null;
  combined_mpg: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Converts a PostgreSQL vehicle row into the application's vehicle format.
 *
 * PostgreSQL NUMERIC values are returned as strings, so gallon capacity and
 * MPG are converted to numbers here.
 */
function mapVehicleRow(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    make: row.make,
    model: row.model,
    modelYear: row.model_year,
    tankCapacityGallons:
      row.tank_capacity_gallons === null
        ? null
        : Number(row.tank_capacity_gallons),
    combinedMpg:
      row.combined_mpg === null ? null : Number(row.combined_mpg),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Creates a vehicle owned by the authenticated user.
 */
export async function createVehicle(
  input: CreateVehicleInput,
): Promise<Vehicle> {
  const result = await database.query<VehicleRow>(
    `
      INSERT INTO vehicles (
        user_id,
        nickname,
        make,
        model,
        model_year,
        tank_capacity_gallons,
        combined_mpg
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)

      RETURNING
        id,
        user_id,
        nickname,
        make,
        model,
        model_year,
        tank_capacity_gallons,
        combined_mpg,
        created_at,
        updated_at
    `,
    [
      input.userId,
      input.nickname,
      input.make,
      input.model,
      input.modelYear,
      input.tankCapacityGallons,
      input.combinedMpg,
    ],
  );

  const vehicle = result.rows[0];

  if (!vehicle) {
    throw new Error("PostgreSQL did not return the created vehicle.");
  }

  return mapVehicleRow(vehicle);
}

/**
 * Returns only the vehicles belonging to the specified user.
 */
export async function listVehiclesForUser(
  userId: string,
): Promise<Vehicle[]> {
  const result = await database.query<VehicleRow>(
    `
      SELECT
        id,
        user_id,
        nickname,
        make,
        model,
        model_year,
        tank_capacity_gallons,
        combined_mpg,
        created_at,
        updated_at
      FROM vehicles
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
    `,
    [userId],
  );

  return result.rows.map(mapVehicleRow);
}

/**
 * Updates a vehicle only when it belongs to the specified user.
 */
export async function updateVehicleForUser(
  input: UpdateVehicleInput,
): Promise<Vehicle | null> {
  const has = (field: keyof UpdateVehicleInput) =>
    Object.prototype.hasOwnProperty.call(input, field);

  const result = await database.query<VehicleRow>(
    `
      UPDATE vehicles
      SET
        nickname = CASE WHEN $3::boolean THEN $4::text ELSE nickname END,
        make = CASE WHEN $5::boolean THEN $6::text ELSE make END,
        model = CASE WHEN $7::boolean THEN $8::text ELSE model END,
        model_year =
          CASE WHEN $9::boolean THEN $10::integer ELSE model_year END,
        tank_capacity_gallons =
          CASE
            WHEN $11::boolean THEN $12::numeric
            ELSE tank_capacity_gallons
          END,
        combined_mpg =
          CASE
            WHEN $13::boolean THEN $14::numeric
            ELSE combined_mpg
          END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND user_id = $2

      RETURNING
        id,
        user_id,
        nickname,
        make,
        model,
        model_year,
        tank_capacity_gallons,
        combined_mpg,
        created_at,
        updated_at
    `,
    [
      input.vehicleId,
      input.userId,
      has("nickname"),
      input.nickname ?? null,
      has("make"),
      input.make ?? null,
      has("model"),
      input.model ?? null,
      has("modelYear"),
      input.modelYear ?? null,
      has("tankCapacityGallons"),
      input.tankCapacityGallons ?? null,
      has("combinedMpg"),
      input.combinedMpg ?? null,
    ],
  );

  const vehicle = result.rows[0];

  return vehicle ? mapVehicleRow(vehicle) : null;
}

/**
 * Deletes a vehicle only when it belongs to the specified user.
 */
export async function deleteVehicleForUser(
  vehicleId: string,
  userId: string,
): Promise<boolean> {
  const result = await database.query(
    `
      DELETE FROM vehicles
      WHERE id = $1
        AND user_id = $2
    `,
    [vehicleId, userId],
  );

  return result.rowCount === 1;
}