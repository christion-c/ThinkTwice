import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../../middleware/require-auth.js";
import { requireInternalService } from "../../middleware/require-internal-service.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import {
  asyncHandler,
  parseRouteParam,
  respondNotFound,
  respondWithValidationError,
  withCurrentUser,
} from "../../lib/route-helpers.js";
import {
  deleteAllFillUpHistoryForUser,
  deleteFillUpHistoryEntry,
  insertFillUpHistory,
  listFillUpHistoryByUserId,
  listFillUpHistoryByFirebaseUid,
  updateFillUpHistoryVehicle,
} from "./fill-up-history.repository.js";

export const fillUpHistoryRouter = Router();

export const entrySchema = z
  .object({
    milesDriven: z.number().min(0).max(99999999),
    fuelPrice: z.number().min(0).max(99999999),
    combinedMpg: z.number().min(0).max(99999999),
    tankCapacity: z.number().min(0).max(99999999),
    gallons: z.number().min(0).max(99999999),
    observedCost: z.number().min(0).max(99999999),
    recordedAt: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "recordedAt must be a valid ISO date string",
      })
      .optional(),
    vehicleId: z.uuid().nullable().optional(),
  })
  .strict();

export const reassignVehicleSchema = z
  .object({
    vehicleId: z.uuid().nullable(),
  })
  .strict();

const entryIdSchema = z.uuid();

// Query-param counterpart of entrySchema's body validation, for the
// /internal route below - a non-empty string is the only requirement.
const firebaseUidQuerySchema = z.string().min(1);

// Saves a fill-up entry for the authenticated user.
fillUpHistoryRouter.post(
  "/",
  requireAuth,
  syncCurrentUser,
  withCurrentUser(async (currentUser, request, response) => {
    const result = entrySchema.safeParse(request.body);

    if (!result.success) {
      respondWithValidationError(
        response,
        result.error,
        "Invalid fill-up data",
      );
      return;
    }

    const { recordedAt, ...fillUpEntry } = result.data;

    const saved = await insertFillUpHistory(currentUser.id, {
      ...fillUpEntry,
      ...(recordedAt ? { recordedAt: new Date(recordedAt) } : {}),
    });

    // Nothing inserted means vehicleId named a vehicle this user doesn't own.
    if (!saved) {
      respondNotFound(response, "Vehicle");
      return;
    }

    response.status(204).end();
  }),
);

// Returns fill-up history for the authenticated user.
fillUpHistoryRouter.get(
  "/",
  requireAuth,
  syncCurrentUser,
  withCurrentUser(async (currentUser, request, response) => {
    const entries = await listFillUpHistoryByUserId(currentUser.id);
    response.status(200).json({ entries });
  }),
);

// Reassigns a fill-up entry to a different vehicle (or unassigns it with
// null) - only when it belongs to the authenticated user.
fillUpHistoryRouter.patch(
  "/:entryId",
  requireAuth,
  syncCurrentUser,
  withCurrentUser(async (currentUser, request, response) => {
    const entryId = parseRouteParam(
      response,
      entryIdSchema,
      request.params.entryId,
      "entry ID",
    );

    if (!entryId) {
      return;
    }

    const validationResult = reassignVehicleSchema.safeParse(request.body);

    if (!validationResult.success) {
      respondWithValidationError(
        response,
        validationResult.error,
        "Invalid vehicle assignment",
      );
      return;
    }

    const entry = await updateFillUpHistoryVehicle(
      entryId,
      currentUser.id,
      validationResult.data.vehicleId,
    );

    if (!entry) {
      respondNotFound(response, "Fill-up entry");
      return;
    }

    response.status(200).json({ entry });
  }),
);

// Deletes a single fill-up entry - only when it belongs to the
// authenticated user.
fillUpHistoryRouter.delete(
  "/:entryId",
  requireAuth,
  syncCurrentUser,
  withCurrentUser(async (currentUser, request, response) => {
    const entryId = parseRouteParam(
      response,
      entryIdSchema,
      request.params.entryId,
      "entry ID",
    );

    if (!entryId) {
      return;
    }

    const deleted = await deleteFillUpHistoryEntry(entryId, currentUser.id);

    if (!deleted) {
      respondNotFound(response, "Fill-up entry");
      return;
    }

    response.status(204).send();
  }),
);

// Deletes every fill-up entry for the authenticated user - the "start my
// data over" bulk action.
fillUpHistoryRouter.delete(
  "/",
  requireAuth,
  syncCurrentUser,
  withCurrentUser(async (currentUser, request, response) => {
    const deletedCount = await deleteAllFillUpHistoryForUser(currentUser.id);
    response.status(200).json({ deletedCount });
  }),
);

// Returns fill-up history for a Firebase UID. Internal-only - called
// by the ML service on the Docker network.
fillUpHistoryRouter.get(
  "/internal",
  requireInternalService,
  asyncHandler(async (request, response) => {
    const result = firebaseUidQuerySchema.safeParse(
      request.query["firebase_uid"],
    );

    if (!result.success) {
      respondWithValidationError(
        response,
        result.error,
        "firebase_uid query param required",
      );
      return;
    }

    const entries = await listFillUpHistoryByFirebaseUid(result.data);
    response.status(200).json({ entries });
  }),
);
