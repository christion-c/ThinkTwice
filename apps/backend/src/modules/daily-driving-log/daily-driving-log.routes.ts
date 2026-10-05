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
  deleteAllDailyDrivingLogsForUser,
  deleteDailyDrivingLog,
  listDailyDrivingLogsForUser,
  updateDailyDrivingLogVehicle,
  upsertDailyDrivingLog,
} from "./daily-driving-log.repository.js";

export const dailyDrivingLogRouter = Router();

export const logSchema = z
  .object({
    logDate: z.iso.date(),
    milesDriven: z.number().min(0).max(9999.99),
    vehicleId: z.uuid().nullable().optional(),
  })
  .strict();

export const reassignVehicleSchema = z
  .object({
    vehicleId: z.uuid().nullable(),
  })
  .strict();

const logIdSchema = z.uuid();

// Creates or corrects the authenticated user's driving log for one day.
dailyDrivingLogRouter.post(
  "/",
  requireAuth,
  syncCurrentUser,
  withCurrentUser(async (currentUser, request, response) => {
    const result = logSchema.safeParse(request.body);

    if (!result.success) {
      respondWithValidationError(
        response,
        result.error,
        "Invalid daily driving log",
      );
      return;
    }

    const log = await upsertDailyDrivingLog(currentUser.id, result.data);

    // Nothing written means vehicleId named a vehicle this user doesn't own.
    if (!log) {
      respondNotFound(response, "Vehicle");
      return;
    }

    response.status(200).json({ log });
  }),
);

// Returns the authenticated user's recent daily driving logs, newest first.
dailyDrivingLogRouter.get(
  "/",
  requireAuth,
  syncCurrentUser,
  withCurrentUser(async (currentUser, request, response) => {
    const logs = await listDailyDrivingLogsForUser(currentUser.id);
    response.status(200).json({ logs });
  }),
);

// Reassigns a daily driving log to a different vehicle (or unassigns it
// with null) - only when it belongs to the authenticated user.
dailyDrivingLogRouter.patch(
  "/:logId",
  requireAuth,
  syncCurrentUser,
  withCurrentUser(async (currentUser, request, response) => {
    const logId = parseRouteParam(
      response,
      logIdSchema,
      request.params.logId,
      "log ID",
    );

    if (!logId) {
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

    const log = await updateDailyDrivingLogVehicle(
      logId,
      currentUser.id,
      validationResult.data.vehicleId,
    );

    if (!log) {
      respondNotFound(response, "Daily driving log");
      return;
    }

    response.status(200).json({ log });
  }),
);

// Deletes a single daily driving log - only when it belongs to the
// authenticated user.
dailyDrivingLogRouter.delete(
  "/:logId",
  requireAuth,
  syncCurrentUser,
  withCurrentUser(async (currentUser, request, response) => {
    const logId = parseRouteParam(
      response,
      logIdSchema,
      request.params.logId,
      "log ID",
    );

    if (!logId) {
      return;
    }

    const deleted = await deleteDailyDrivingLog(logId, currentUser.id);

    if (!deleted) {
      respondNotFound(response, "Daily driving log");
      return;
    }

    response.status(204).send();
  }),
);

// Deletes every daily driving log for the authenticated user - the
// "start my data over" bulk action.
dailyDrivingLogRouter.delete(
  "/",
  requireAuth,
  syncCurrentUser,
  withCurrentUser(async (currentUser, request, response) => {
    const deletedCount = await deleteAllDailyDrivingLogsForUser(currentUser.id);
    response.status(200).json({ deletedCount });
  }),
);
