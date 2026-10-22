import { afterEach, describe, expect, it } from "vitest";
import * as z from "zod";

import { buildApp, type App } from "../src/app.ts";
import { testConfig } from "./helpers/config.ts";

const SECRET_DETAIL = "database password is hunter2";

let app: App | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

/** Builds the app with extra test-only routes that trigger each kind of error. */
async function buildAppWithTestRoutes(rateLimitMax = 1000): Promise<App> {
  const testApp = await buildApp(testConfig({ rateLimitMax }));
  testApp.post(
    "/test/echo",
    { schema: { body: z.strictObject({ amountCents: z.int() }) } },
    (request) => request.body,
  );
  testApp.get("/test/crash", () => {
    throw new Error(SECRET_DETAIL);
  });
  return testApp;
}

describe("validation errors", () => {
  it("return 400 with the fields that are wrong", async () => {
    app = await buildAppWithTestRoutes();
    const response = await app.inject({
      method: "POST",
      url: "/test/echo",
      payload: { amountCents: "lots" },
    });
    expect(response.statusCode).toBe(400);
    const body = response.json<{
      error: { code: string; issues: { path: string }[] };
    }>();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.issues.map((issue) => issue.path)).toEqual([
      "/amountCents",
    ]);
  });

  it("reject unknown fields", async () => {
    app = await buildAppWithTestRoutes();
    const response = await app.inject({
      method: "POST",
      url: "/test/echo",
      payload: { amountCents: 450, userId: "someone-else" },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("malformed requests", () => {
  it("return 400 for invalid JSON", async () => {
    app = await buildAppWithTestRoutes();
    const response = await app.inject({
      method: "POST",
      url: "/test/echo",
      headers: { "content-type": "application/json" },
      payload: "{not json",
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "BAD_REQUEST",
        message: "The request couldn't be understood.",
      },
    });
  });

  it("return 413 for bodies over the size limit", async () => {
    app = await buildAppWithTestRoutes();
    const response = await app.inject({
      method: "POST",
      url: "/test/echo",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({
        amountCents: 1,
        padding: "x".repeat(200 * 1024),
      }),
    });
    expect(response.statusCode).toBe(413);
    expect(response.json<{ error: { code: string } }>().error.code).toBe(
      "PAYLOAD_TOO_LARGE",
    );
  });

  it("return 415 for unsupported content types", async () => {
    app = await buildAppWithTestRoutes();
    const response = await app.inject({
      method: "POST",
      url: "/test/echo",
      headers: { "content-type": "application/xml" },
      payload: "<amountCents>1</amountCents>",
    });
    expect(response.statusCode).toBe(415);
    expect(response.json<{ error: { code: string } }>().error.code).toBe(
      "UNSUPPORTED_MEDIA_TYPE",
    );
  });
});

describe("unexpected errors", () => {
  it("return a generic 500 without exposing internal details", async () => {
    app = await buildAppWithTestRoutes();
    const response = await app.inject({ method: "GET", url: "/test/crash" });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong on our side. Please try again.",
      },
    });
    expect(response.body).not.toContain("hunter2");
    expect(response.body).not.toContain("stack");
  });
});

describe("rate limiting", () => {
  it("returns 429 with a Retry-After header once the limit is reached", async () => {
    app = await buildAppWithTestRoutes(2);
    await app.inject({ method: "GET", url: "/health" });
    await app.inject({ method: "GET", url: "/health" });
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(429);
    expect(response.headers["retry-after"]).toBeDefined();
    expect(response.json()).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please wait a moment and try again.",
      },
    });
  });
});
