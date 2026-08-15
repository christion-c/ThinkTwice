import type { Request, Response } from "express";
import type { ZodError, ZodType } from "zod";

import type { UserProfile } from "../modules/users/user.repository.js";

/**
 * Reads the PostgreSQL profile syncCurrentUser attached to the request, or
 * responds with 500 and returns null. Every route behind requireAuth +
 * syncCurrentUser needs this guard because currentUser is typed optional —
 * TypeScript can't statically know the middleware ran first.
 */
export function requireCurrentUser(
  request: Request,
  response: Response,
): UserProfile | null {
  const currentUser = request.currentUser;

  if (!currentUser) {
    response.status(500).json({ error: "User profile unavailable" });
    return null;
  }

  return currentUser;
}

/**
 * Responds with 400 and the field-level issues from a failed zod safeParse.
 */
export function respondWithValidationError(
  response: Response,
  error: ZodError,
  message: string,
): void {
  response.status(400).json({
    error: message,
    details: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

/**
 * Parses a single route param (e.g. request.params.vehicleId) against a
 * zod schema, or responds with 400 and returns null. Route params are
 * usually just an ID, so this skips the field-level detail
 * respondWithValidationError gives for a whole request body — a plain
 * "Invalid <label>" is all there is to say about one malformed value.
 */
export function parseRouteParam<T>(
  response: Response,
  schema: ZodType<T>,
  value: unknown,
  label: string,
): T | null {
  const result = schema.safeParse(value);

  if (!result.success) {
    response.status(400).json({ error: `Invalid ${label}` });
    return null;
  }

  return result.data;
}
