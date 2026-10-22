import { errors } from "jose";
import { afterEach, describe, expect, it } from "vitest";
import * as z from "zod";

import { buildApp, type App } from "../../src/app.ts";
import { requireIdentity } from "../../src/plugins/auth.ts";
import { buildTestApp, testConfig } from "../helpers/config.ts";
import { authHeaders, signTestToken } from "../helpers/tokens.ts";
import { describeEndpointAuthentication } from "./endpoint-security.ts";

/** Builds the test app with a private route that reports who the request came from. */
async function buildAppWithPrivateRoute(): Promise<App> {
  const app = await buildTestApp();
  app.get("/test/whoami", (request) => requireIdentity(request));
  app.post(
    "/test/echo",
    { schema: { body: z.strictObject({ amountCents: z.int() }) } },
    (request) => request.body,
  );
  return app;
}

describeEndpointAuthentication(
  { method: "GET", url: "/test/whoami" },
  buildAppWithPrivateRoute,
);
describeEndpointAuthentication(
  { method: "POST", url: "/test/echo", payload: { amountCents: 1 } },
  buildAppWithPrivateRoute,
);

let app: App | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("authentication", () => {
  it("accepts a valid token and records who sent the request", async () => {
    app = await buildAppWithPrivateRoute();
    const response = await app.inject({
      method: "GET",
      url: "/test/whoami",
      headers: await authHeaders("alice-uid"),
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      firebaseUid: "alice-uid",
      email: "alice-uid@example.com",
      emailVerified: true,
    });
  });

  it("treats a missing email as unverified", async () => {
    app = await buildAppWithPrivateRoute();
    const token = await signTestToken("no-email-uid", {
      claims: { email: undefined, email_verified: undefined },
    });
    const response = await app.inject({
      method: "GET",
      url: "/test/whoami",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.json()).toEqual({
      firebaseUid: "no-email-uid",
      email: null,
      emailVerified: false,
    });
  });

  it("checks the token before looking at the request body", async () => {
    app = await buildAppWithPrivateRoute();
    const response = await app.inject({
      method: "POST",
      url: "/test/echo",
      payload: { amountCents: "not a number" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("routes are private unless marked public", async () => {
    app = await buildAppWithPrivateRoute();
    expect(
      (await app.inject({ method: "GET", url: "/health" })).statusCode,
    ).toBe(200);
    expect(
      (await app.inject({ method: "GET", url: "/test/whoami" })).statusCode,
    ).toBe(401);
  });

  it("unknown routes return 401 to anonymous callers and 404 to signed-in users", async () => {
    app = await buildAppWithPrivateRoute();
    expect((await app.inject({ method: "GET", url: "/nope" })).statusCode).toBe(
      401,
    );
    const signedIn = await app.inject({
      method: "GET",
      url: "/nope",
      headers: await authHeaders("alice-uid"),
    });
    expect(signedIn.statusCode).toBe(404);
  });

  it("returns 500, not 401, when Google's signing keys can't be fetched", async () => {
    app = await buildApp(testConfig(), {
      firebaseSigningKeys: () => Promise.reject(new errors.JWKSTimeout()),
    });
    app.get("/test/whoami", (request) => requireIdentity(request));
    const response = await app.inject({
      method: "GET",
      url: "/test/whoami",
      headers: await authHeaders("alice-uid"),
    });
    expect(response.statusCode).toBe(500);
    expect(response.json<{ error: { code: string } }>().error.code).toBe(
      "INTERNAL_ERROR",
    );
  });
});
