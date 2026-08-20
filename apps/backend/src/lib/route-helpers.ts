import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodError, ZodType } from "zod";

import type { UserProfile } from "../modules/users/user.repository.js";

// Reads the PostgreSQL profile syncCurrentUser attached to the request,
// or responds with 500 and returns null. Every route behind
// requireAuth + syncCurrentUser needs this guard because currentUser is
// typed optional - TypeScript can't statically know the middleware ran first.
export function requireCurrentUser(
  request: Request,
  response: Response,
): UserProfile | null {
  const currentUser = request.currentUser;

  // Should never happen if the middleware chain is set up correctly, but
  // guard anyway rather than letting a route crash on a missing profile.
  if (!currentUser) {
    response.status(500).json({ error: "User profile unavailable" });
    return null;
  }

  return currentUser;
}

// Wraps an async route handler so a rejected promise is forwarded to
// Express's error middleware via `next`, instead of crashing the
// process or hanging the request. Express only does this
// automatically for synchronous throws, not rejected promises.
export function asyncHandler(
  handler: (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => Promise<void>,
): RequestHandler {
  return (request, response, next) => {
    handler(request, response, next).catch(next);
  };
}

// Wraps a route handler that needs the current user: resolves
// requireCurrentUser, bails out (the 500 response already sent) when
// it's missing, and otherwise calls through with the resolved profile.
// Combines this with asyncHandler's promise-rejection forwarding since
// every current-user route in this codebase is also async.
export function withCurrentUser(
  handler: (
    currentUser: UserProfile,
    request: Request,
    response: Response,
    next: NextFunction,
  ) => Promise<void>,
): RequestHandler {
  return asyncHandler(async (request, response, next) => {
    const currentUser = requireCurrentUser(request, response);

    if (!currentUser) {
      return;
    }

    await handler(currentUser, request, response, next);
  });
}

// Responds with 400 and the field-level issues from a failed zod safeParse.
export function respondWithValidationError(
  response: Response,
  error: ZodError,
  message: string,
): void {
  response.status(400).json({
    error: message,
    // Turn each zod issue into a flat { field, message } pair the
    // frontend can map directly onto a form field.
    details: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

// Responds with 404 and a "<label> not found" message, for the
// standard "delete/update matched no row owned by this user" case.
export function respondNotFound(response: Response, label: string): void {
  response.status(404).json({
    error: `${label} not found`,
  });
}

// Parses a single route param (e.g. request.params.vehicleId) against a
// zod schema, or responds with 400 and returns null. Route params are
// usually just an ID, so this skips the field-level detail
// respondWithValidationError gives for a whole request body - a plain
// "Invalid <label>" is all there is to say about one malformed value.
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
