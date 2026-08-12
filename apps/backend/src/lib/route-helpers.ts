import type { Request, Response } from "express";
import type { ZodError } from "zod";

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
