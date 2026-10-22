// Real RS256 key pairs for signing Firebase-style ID tokens in tests, so signature checks are genuinely exercised.
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  UnsecuredJWT,
  type JWTPayload,
} from "jose";

export const TEST_FIREBASE_PROJECT_ID = "demo-thinktwice";

const TRUSTED_KEY_ID = "test-key";
const trustedKeys = await generateKeyPair("RS256");
const untrustedKeys = await generateKeyPair("RS256");

/** The only key the test app trusts, in the same JWK set format Google publishes. */
export const testSigningKeys = createLocalJWKSet({
  keys: [
    {
      ...(await exportJWK(trustedKeys.publicKey)),
      kid: TRUSTED_KEY_ID,
      alg: "RS256",
      use: "sig",
    },
  ],
});

export interface TestTokenOptions {
  /** Claims to add, replace or (with undefined) remove. */
  claims?: Record<string, unknown>;
  /** "untrusted" signs with a key the app doesn't trust. */
  signedBy?: "trusted" | "untrusted";
  keyId?: string;
}

/** Returns a Unix timestamp (in seconds) the given number of seconds from now. */
export function secondsFromNow(seconds: number): number {
  return Math.floor(Date.now() / 1000) + seconds;
}

/** Returns the claims of a valid Firebase ID token for the given UID, with overrides applied. */
function tokenClaims(
  firebaseUid: string,
  overrides: Record<string, unknown>,
): JWTPayload {
  const now = secondsFromNow(0);
  return {
    iss: `https://securetoken.google.com/${TEST_FIREBASE_PROJECT_ID}`,
    aud: TEST_FIREBASE_PROJECT_ID,
    sub: firebaseUid,
    iat: now,
    exp: now + 3600,
    auth_time: now,
    email: `${firebaseUid}@example.com`,
    email_verified: true,
    ...overrides,
  };
}

/** Signs a Firebase-style ID token; by default it's valid for the test project. */
export async function signTestToken(
  firebaseUid: string,
  options: TestTokenOptions = {},
): Promise<string> {
  const { claims = {}, signedBy = "trusted", keyId = TRUSTED_KEY_ID } = options;
  const keys = signedBy === "trusted" ? trustedKeys : untrustedKeys;
  return new SignJWT(tokenClaims(firebaseUid, claims))
    .setProtectedHeader({ alg: "RS256", kid: keyId, typ: "JWT" })
    .sign(keys.privateKey);
}

/** Builds an unsigned token (algorithm "none"), which must always be rejected. */
export function unsignedTestToken(firebaseUid: string): string {
  return new UnsecuredJWT(tokenClaims(firebaseUid, {})).encode();
}

/** Returns request headers carrying a valid token for the given UID. */
export async function authHeaders(
  firebaseUid: string,
): Promise<{ authorization: string }> {
  return { authorization: `Bearer ${await signTestToken(firebaseUid)}` };
}
