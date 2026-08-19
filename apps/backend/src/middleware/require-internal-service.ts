import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

import { env } from "../config/env.js";

// Compares two tokens without leaking timing information. Hashing both
// sides to a fixed-length digest first avoids timingSafeEqual's
// length-mismatch throw, without an early-return branch that would leak
// the token's length through response timing.
function tokensMatch(a: string, b: string): boolean {
  const hashedA = createHash("sha256").update(a).digest();
  const hashedB = createHash("sha256").update(b).digest();

  return timingSafeEqual(hashedA, hashedB);
}

// Protects internal-only, service-to-service routes (called by the ML
// service on the Docker network / over the internet in production, not
// by end users) with a shared secret instead of a Firebase user token.
// Expects the request header: X-Internal-Token: <INTERNAL_SERVICE_TOKEN>
export const requireInternalService: RequestHandler = (
  request,
  response,
  next,
) => {
  const providedToken = request.header("x-internal-token");

  // Reject a missing token or one that doesn't match the configured secret.
  if (!providedToken || !tokensMatch(providedToken, env.INTERNAL_SERVICE_TOKEN)) {
    response.status(401).json({
      error: "Authentication required",
    });
    return;
  }

  // Token matches - continue to the actual route handler.
  next();
};
