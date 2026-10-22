// Verifies Firebase ID tokens with a standard JWT library, following Firebase's documented checks:
// https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
import {
  createRemoteJWKSet,
  errors,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";

/** Google's public keys for Firebase ID tokens, in JWK format. */
export const FIREBASE_SIGNING_KEYS_URL = new URL(
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
);

/** Allowed clock difference between Google's servers and ours, in seconds. */
const CLOCK_TOLERANCE_SECONDS = 5;

const MAX_UID_LENGTH = 128;

/** Who a verified token belongs to. */
export interface VerifiedIdentity {
  firebaseUid: string;
  email: string | null;
  emailVerified: boolean;
}

/** Checks a Firebase ID token and returns who it belongs to, or throws InvalidTokenError. */
export type TokenVerifier = (token: string) => Promise<VerifiedIdentity>;

/** The token was missing a required property, expired, forged or meant for another project. */
export class InvalidTokenError extends Error {
  /** Creates an error whose message (for logs only) says why the token was rejected. */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "InvalidTokenError";
  }
}

/** jose errors that mean the token itself is bad, as opposed to a problem fetching Google's keys. */
const INVALID_TOKEN_ERRORS = [
  errors.JWTExpired,
  errors.JWTClaimValidationFailed,
  errors.JWTInvalid,
  errors.JWSInvalid,
  errors.JWSSignatureVerificationFailed,
  errors.JOSEAlgNotAllowed,
  errors.JOSENotSupported,
  errors.JWKSNoMatchingKey,
  errors.JWKSMultipleMatchingKeys,
];

/** Returns true if a Unix timestamp (in seconds) is not in the future, allowing for clock drift. */
function isNotInFuture(timestamp: unknown): boolean {
  return (
    typeof timestamp === "number" &&
    timestamp <= Date.now() / 1000 + CLOCK_TOLERANCE_SECONDS
  );
}

/** Creates a verifier for one Firebase project. Tests pass their own signing keys; production uses Google's. */
export function createFirebaseTokenVerifier(
  projectId: string,
  signingKeys: JWTVerifyGetKey = createRemoteJWKSet(FIREBASE_SIGNING_KEYS_URL),
): TokenVerifier {
  const issuer = `https://securetoken.google.com/${projectId}`;

  /** Checks the signature, audience, issuer and expiry, turning jose's token errors into InvalidTokenError. */
  async function verifySignatureAndClaims(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, signingKeys, {
        algorithms: ["RS256"],
        audience: projectId,
        issuer,
        requiredClaims: ["sub", "iat", "exp", "auth_time"],
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
      });
      return payload;
    } catch (error) {
      if (
        INVALID_TOKEN_ERRORS.some(
          (invalidTokenError) => error instanceof invalidTokenError,
        )
      ) {
        throw new InvalidTokenError("ID token failed verification.", {
          cause: error,
        });
      }
      throw error;
    }
  }

  return async (token) => {
    const payload = await verifySignatureAndClaims(token);
    const {
      sub,
      iat,
      auth_time: authTime,
      email,
      email_verified: emailVerified,
    } = payload;
    if (
      typeof sub !== "string" ||
      sub.length === 0 ||
      sub.length > MAX_UID_LENGTH
    ) {
      throw new InvalidTokenError("ID token has an invalid subject.");
    }
    if (!isNotInFuture(iat) || !isNotInFuture(authTime)) {
      throw new InvalidTokenError("ID token was issued in the future.");
    }

    return {
      firebaseUid: sub,
      email: typeof email === "string" ? email : null,
      emailVerified: emailVerified === true,
    };
  };
}
