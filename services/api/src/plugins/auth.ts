// Deny by default: every route requires a valid Firebase ID token unless its config sets `public: true`.
import type { FastifyInstance, FastifyRequest } from "fastify";

import {
  InvalidTokenError,
  type TokenVerifier,
  type VerifiedIdentity,
} from "../auth/firebase-token.ts";
import { HttpError } from "../errors/http-error.ts";

declare module "fastify" {
  interface FastifyContextConfig {
    /** Set to true only for routes anyone may call without signing in, such as GET /health. */
    public?: boolean;
  }

  interface FastifyRequest {
    /** Who sent the request. Set for every non-public route; null on public routes. */
    identity: VerifiedIdentity | null;
  }
}

/** Firebase ID tokens are a few kilobytes at most; anything longer is rejected without being parsed. */
const MAX_TOKEN_LENGTH = 4096;

const BEARER_TOKEN_PATTERN =
  /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*)$/i;

/** Returns the token from an "Authorization: Bearer <token>" header, or null if it's missing or malformed. */
function readBearerToken(header: string | undefined): string | null {
  if (header === undefined || header.length > MAX_TOKEN_LENGTH) {
    return null;
  }
  return BEARER_TOKEN_PATTERN.exec(header)?.[1] ?? null;
}

/** Returns the signed-in user's identity, or throws 401 if the request has none. */
export function requireIdentity(request: FastifyRequest): VerifiedIdentity {
  if (request.identity === null) {
    throw new HttpError(401, "Request has no verified identity.");
  }
  return request.identity;
}

/** Requires a verified Firebase ID token on every non-public route and records who sent the request. */
export function registerAuth(
  app: FastifyInstance,
  verifyToken: TokenVerifier,
): void {
  app.decorateRequest("identity", null);

  app.addHook("onRequest", async (request) => {
    if (request.routeOptions.config.public === true) {
      return;
    }
    const token = readBearerToken(request.headers.authorization);
    if (token === null) {
      throw new HttpError(401, "Missing or malformed Authorization header.");
    }
    try {
      request.identity = await verifyToken(token);
    } catch (error) {
      if (error instanceof InvalidTokenError) {
        request.log.info(
          { reason: error.message },
          "Rejected invalid ID token",
        );
        throw new HttpError(401, error.message, { cause: error });
      }
      throw error;
    }
  });
}
