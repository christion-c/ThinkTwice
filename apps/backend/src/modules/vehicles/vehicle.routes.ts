import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import {
  createVehicle,
  deleteVehicleForUser,
  listVehiclesForUser,
  type UpdateVehicleInput,
  updateVehicleForUser,
} from "./vehicle.repository.js";

export const vehicleRouter = Router();

export const createVehicleSchema = z
  .object({
    nickname: z.string().trim().min(1).max(50),
    make: z.string().trim().min(1).max(100).nullable().optional(),
    model: z.string().trim().min(1).max(100).nullable().optional(),
    modelYear: z.number().int().min(1886).max(2200).nullable().optional(),
    tankCapacityGallons: z
      .number()
      .positive()
      .max(9999.99)
      .nullable()
      .optional(),
    combinedMpg: z
      .number()
      .positive()
      .max(9999.99)
      .nullable()
      .optional(),
  })
  .strict();

export const updateVehicleSchema = createVehicleSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one vehicle field must be provided",
  });

const vehicleIdSchema = z.uuid();

// Every vehicle endpoint requires a verified Firebase user.
vehicleRouter.use(requireAuth, syncCurrentUser);

/**
 * Returns the authenticated user's vehicles.
 */
vehicleRouter.get("/", async (request, response, next) => {
  const currentUser = request.currentUser;

  if (!currentUser) {
    response.status(500).json({
      error: "User profile unavailable",
    });
    return;
  }

  try {
    const vehicles = await listVehiclesForUser(currentUser.id);

    response.status(200).json({
      vehicles,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Creates a vehicle owned by the authenticated user.
 */
vehicleRouter.post("/", async (request, response, next) => {
  const currentUser = request.currentUser;

  if (!currentUser) {
    response.status(500).json({
      error: "User profile unavailable",
    });
    return;
  }

  const validationResult = createVehicleSchema.safeParse(request.body);

  if (!validationResult.success) {
    response.status(400).json({
      error: "Invalid vehicle data",
      details: validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const input = validationResult.data;

  try {
    const vehicle = await createVehicle({
      userId: currentUser.id,
      nickname: input.nickname,
      make: input.make ?? null,
      model: input.model ?? null,
      modelYear: input.modelYear ?? null,
      tankCapacityGallons: input.tankCapacityGallons ?? null,
      combinedMpg: input.combinedMpg ?? null,
    });

    response.status(201).json({
      vehicle,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Updates a vehicle only when it belongs to the authenticated user.
 */
vehicleRouter.patch("/:vehicleId", async (request, response, next) => {
  const currentUser = request.currentUser;

  if (!currentUser) {
    response.status(500).json({
      error: "User profile unavailable",
    });
    return;
  }

  const vehicleIdResult = vehicleIdSchema.safeParse(
    request.params.vehicleId,
  );

  if (!vehicleIdResult.success) {
    response.status(400).json({
      error: "Invalid vehicle ID",
    });
    return;
  }

  const validationResult = updateVehicleSchema.safeParse(request.body);

  if (!validationResult.success) {
    response.status(400).json({
      error: "Invalid vehicle data",
      details: validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const updates = validationResult.data;

  const updateInput: UpdateVehicleInput = {
    vehicleId: vehicleIdResult.data,
    userId: currentUser.id,
  };

  if (updates.nickname !== undefined) {
    updateInput.nickname = updates.nickname;
  }

  if (updates.make !== undefined) {
    updateInput.make = updates.make;
  }

  if (updates.model !== undefined) {
    updateInput.model = updates.model;
  }

  if (updates.modelYear !== undefined) {
    updateInput.modelYear = updates.modelYear;
  }

  if (updates.tankCapacityGallons !== undefined) {
    updateInput.tankCapacityGallons = updates.tankCapacityGallons;
  }

  if (updates.combinedMpg !== undefined) {
    updateInput.combinedMpg = updates.combinedMpg;
  }

  try {
    const vehicle = await updateVehicleForUser(updateInput);

    if (!vehicle) {
      response.status(404).json({
        error: "Vehicle not found",
      });
      return;
    }

    response.status(200).json({
      vehicle,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Deletes a vehicle only when it belongs to the authenticated user.
 */
vehicleRouter.delete("/:vehicleId", async (request, response, next) => {
  const currentUser = request.currentUser;

  if (!currentUser) {
    response.status(500).json({
      error: "User profile unavailable",
    });
    return;
  }

  const vehicleIdResult = vehicleIdSchema.safeParse(
    request.params.vehicleId,
  );

  if (!vehicleIdResult.success) {
    response.status(400).json({
      error: "Invalid vehicle ID",
    });
    return;
  }

  try {
    const deleted = await deleteVehicleForUser(
      vehicleIdResult.data,
      currentUser.id,
    );

    if (!deleted) {
      response.status(404).json({
        error: "Vehicle not found",
      });
      return;
    }

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});