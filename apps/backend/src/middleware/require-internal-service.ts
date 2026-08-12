import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

import { env } from "../config/env.js";

/**
 * Hashing both sides to a fixed-length digest before comparing avoids
 * timingSafeEqual's length-mismatch throw without leaking the token's
 * length through an early-return branch.
 */
function tokensMatch(a: string, b: string): boolean {
  const hashedA = createHash("sha256").update(a).digest();
  const hashedB = createHash("sha256").update(b).digest();

  return timingSafeEqual(hashedA, hashedB);
}

/**
 * Protects internal-only, service-to-service routes (called by the ML
 * service on the Docker network / over the internet in production, not by
 * end users) with a shared secret instead of a Firebase user token.
 *
 * Expected request header:
 * X-Internal-Token: <INTERNAL_SERVICE_TOKEN>
 */
export const requireInternalService: RequestHandler = (
  request,
  response,
  next,
) => {
  const providedToken = request.header("x-internal-token");

  if (!providedToken || !tokensMatch(providedToken, env.INTERNAL_SERVICE_TOKEN)) {
    response.status(401).json({
      error: "Authentication required",
    });
    return;
  }

  next();
};
