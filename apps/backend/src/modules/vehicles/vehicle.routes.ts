import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../../middleware/require-auth.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import {
  parseRouteParam,
  respondNotFound,
  respondWithValidationError,
  withCurrentUser,
} from "../../lib/route-helpers.js";
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

// Returns the authenticated user's vehicles.
vehicleRouter.get(
  "/",
  withCurrentUser(async (currentUser, request, response) => {
    const vehicles = await listVehiclesForUser(currentUser.id);

    response.status(200).json({
      vehicles,
    });
  }),
);

// Creates a vehicle owned by the authenticated user.
vehicleRouter.post(
  "/",
  withCurrentUser(async (currentUser, request, response) => {
    const validationResult = createVehicleSchema.safeParse(request.body);

    if (!validationResult.success) {
      respondWithValidationError(
        response,
        validationResult.error,
        "Invalid vehicle data",
      );
      return;
    }

    const input = validationResult.data;

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
  }),
);

// Updates a vehicle only when it belongs to the authenticated user.
vehicleRouter.patch(
  "/:vehicleId",
  withCurrentUser(async (currentUser, request, response) => {
    const vehicleId = parseRouteParam(response, vehicleIdSchema, request.params.vehicleId, "vehicle ID");

    if (!vehicleId) {
      return;
    }

    const validationResult = updateVehicleSchema.safeParse(request.body);

    if (!validationResult.success) {
      respondWithValidationError(
        response,
        validationResult.error,
        "Invalid vehicle data",
      );
      return;
    }

    // The repository distinguishes "field omitted" from "field explicitly
    // set" via hasOwnProperty, and zod's partial schema already omits keys
    // that weren't in the request body — so spreading `updates` preserves
    // exactly the fields the client actually sent, nothing more.
    const updateInput: UpdateVehicleInput = {
      vehicleId,
      userId: currentUser.id,
      ...validationResult.data,
    };

    const vehicle = await updateVehicleForUser(updateInput);

    if (!vehicle) {
      respondNotFound(response, "Vehicle");
      return;
    }

    response.status(200).json({
      vehicle,
    });
  }),
);

// Deletes a vehicle only when it belongs to the authenticated user.
vehicleRouter.delete(
  "/:vehicleId",
  withCurrentUser(async (currentUser, request, response) => {
    const vehicleId = parseRouteParam(response, vehicleIdSchema, request.params.vehicleId, "vehicle ID");

    if (!vehicleId) {
      return;
    }

    const deleted = await deleteVehicleForUser(
      vehicleId,
      currentUser.id,
    );

    if (!deleted) {
      respondNotFound(response, "Vehicle");
      return;
    }

    response.status(204).send();
  }),
);