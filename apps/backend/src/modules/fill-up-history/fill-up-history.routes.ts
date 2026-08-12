import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../../middleware/require-auth.js";
import { requireInternalService } from "../../middleware/require-internal-service.js";
import { syncCurrentUser } from "../../middleware/sync-current-user.js";
import { requireCurrentUser } from "../../lib/route-helpers.js";
import {
  insertFillUpHistory,
  listFillUpHistoryByUserId,
  listFillUpHistoryByFirebaseUid,
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
  })
  .strict();

/**
 * Saves a fill-up entry for the authenticated user.
 */
fillUpHistoryRouter.post(
  "/",
  requireAuth,
  syncCurrentUser,
  async (request, response, next) => {
    const currentUser = requireCurrentUser(request, response);

    if (!currentUser) {
      return;
    }

    const result = entrySchema.safeParse(request.body);

    if (!result.success) {
      response.status(400).json({ error: "Invalid fill-up data" });
      return;
    }

    try {
      const { recordedAt, ...fillUpEntry } = result.data;

      await insertFillUpHistory(currentUser.id, {
        ...fillUpEntry,
        ...(recordedAt ? { recordedAt: new Date(recordedAt) } : {}),
      });
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Returns fill-up history for the authenticated user.
 */
fillUpHistoryRouter.get(
  "/",
  requireAuth,
  syncCurrentUser,
  async (request, response, next) => {
    const currentUser = requireCurrentUser(request, response);

    if (!currentUser) {
      return;
    }

    try {
      const entries = await listFillUpHistoryByUserId(currentUser.id);
      response.status(200).json({ entries });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * Returns fill-up history for a Firebase UID.
 * Internal-only — called by the ML service on the Docker network.
 */
fillUpHistoryRouter.get("/internal", requireInternalService, async (request, response, next) => {
  const firebaseUid =
    typeof request.query["firebase_uid"] === "string"
      ? request.query["firebase_uid"]
      : null;

  if (!firebaseUid) {
    response.status(400).json({ error: "firebase_uid query param required" });
    return;
  }

  try {
    const entries = await listFillUpHistoryByFirebaseUid(firebaseUid);
    response.status(200).json({ entries });
  } catch (error) {
    next(error);
  }
});
