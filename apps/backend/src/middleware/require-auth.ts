import type { RequestHandler } from "express";

import { firebaseAuth } from "../config/firebase.js";

// Protects a route using Firebase Authentication. Expects the request
// header: Authorization: Bearer <firebase-id-token>
export const requireAuth: RequestHandler = async (
  request,
  response,
  next,
) => {
  const authorizationHeader = request.header("authorization");

  // A protected route requires an Authorization header.
  if (!authorizationHeader) {
    response.status(401).json({
      error: "Authentication required",
    });
    return;
  }

  // Split "Bearer <token>" into its two parts.
  const headerParts = authorizationHeader.trim().split(/\s+/);
  const scheme = headerParts[0];
  const idToken = headerParts[1];

  // Reject anything that isn't exactly "Bearer <token>".
  if (
    scheme?.toLowerCase() !== "bearer" ||
    !idToken ||
    headerParts.length !== 2
  ) {
    response.status(401).json({
      error: "Authorization header must use Bearer authentication",
    });
    return;
  }

  try {
    // Firebase verifies the signature, expiration time, and project.
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);

    // Make the verified Firebase user available to later route handlers.
    request.auth = decodedToken;

    // Token is valid - continue to the actual route handler.
    next();
  } catch {
    // Signature invalid, token expired, or wrong project.
    response.status(401).json({
      error: "Invalid or expired authentication token",
    });
  }
};
