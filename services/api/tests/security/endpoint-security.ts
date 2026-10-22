// Reusable rule 13 tests. Every new endpoint's test file must call describeEndpointAuthentication for it,
// and add cross-user tests proving user A can't read, list, update or delete user B's data through it.
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { App } from "../../src/app.ts";
import {
  secondsFromNow,
  signTestToken,
  unsignedTestToken,
} from "../helpers/tokens.ts";

export interface EndpointUnderTest {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  payload?: object;
}

const UID = "security-test-uid";

/** Every way a request can fail to prove who sent it, paired with the headers that send it. */
const BAD_CREDENTIALS: [string, () => Promise<Record<string, string>>][] = [
  ["no Authorization header", () => Promise.resolve({})],
  [
    "a non-Bearer scheme",
    () => Promise.resolve({ authorization: "Basic dXNlcjpwYXNzd29yZA==" }),
  ],
  [
    "a malformed token",
    () => Promise.resolve({ authorization: "Bearer not-a-jwt" }),
  ],
  [
    "an oversized header",
    () => Promise.resolve({ authorization: `Bearer ${"a".repeat(5000)}.b.c` }),
  ],
  [
    "an unsigned token",
    () =>
      Promise.resolve({ authorization: `Bearer ${unsignedTestToken(UID)}` }),
  ],
  [
    "a token signed by an untrusted key",
    () => bearer({ signedBy: "untrusted" }),
  ],
  ["a token with an unknown key ID", () => bearer({ keyId: "unknown-key" })],
  [
    "an expired token",
    () =>
      bearer({
        claims: { iat: secondsFromNow(-7200), exp: secondsFromNow(-3600) },
      }),
  ],
  [
    "a token for another Firebase project",
    () => bearer({ claims: { aud: "someone-elses-project" } }),
  ],
  [
    "a token from the wrong issuer",
    () => bearer({ claims: { iss: "https://securetoken.google.com/evil" } }),
  ],
  ["a token without a subject", () => bearer({ claims: { sub: undefined } })],
  ["a token with an empty subject", () => bearer({ claims: { sub: "" } })],
  [
    "a token without a sign-in time",
    () => bearer({ claims: { auth_time: undefined } }),
  ],
  [
    "a token with a future sign-in time",
    () => bearer({ claims: { auth_time: secondsFromNow(3600) } }),
  ],
  [
    "a token issued in the future",
    () =>
      bearer({
        claims: { iat: secondsFromNow(3600), exp: secondsFromNow(7200) },
      }),
  ],
];

/** Returns an Authorization header with a test token built from the given options. */
async function bearer(
  options: Parameters<typeof signTestToken>[1],
): Promise<Record<string, string>> {
  return { authorization: `Bearer ${await signTestToken(UID, options)}` };
}

/** Generates tests proving the endpoint rejects every kind of missing, forged or invalid token with 401. */
export function describeEndpointAuthentication(
  endpoint: EndpointUnderTest,
  createApp: () => Promise<App>,
): void {
  describe(`${endpoint.method} ${endpoint.url} authentication`, () => {
    let app: App;

    beforeAll(async () => {
      app = await createApp();
    });

    afterAll(async () => {
      await app.close();
    });

    it.each(BAD_CREDENTIALS)(
      "rejects %s with 401",
      async (_description, headers) => {
        const response = await app.inject({
          method: endpoint.method,
          url: endpoint.url,
          headers: await headers(),
          ...(endpoint.payload === undefined
            ? {}
            : { payload: endpoint.payload }),
        });
        expect(response.statusCode).toBe(401);
        expect(response.headers["www-authenticate"]).toBe("Bearer");
        expect(response.json()).toEqual({
          error: {
            code: "UNAUTHENTICATED",
            message: "Please sign in to continue.",
          },
        });
      },
    );
  });
}
