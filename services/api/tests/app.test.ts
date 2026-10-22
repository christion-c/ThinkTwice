import { afterEach, describe, expect, it } from "vitest";

import { buildApp, type App } from "../src/app.ts";
import { ALLOWED_ORIGIN, testConfig } from "./helpers/config.ts";

let app: App | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("GET /health", () => {
  it("reports that the API is running", async () => {
    app = await buildApp(testConfig());
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});

describe("security headers", () => {
  it("sets protective headers and hides the server technology", async () => {
    app = await buildApp(testConfig());
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["strict-transport-security"]).toBeDefined();
    expect(response.headers["content-security-policy"]).toBeDefined();
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("CORS", () => {
  it("allows configured origins", async () => {
    app = await buildApp(testConfig());
    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: ALLOWED_ORIGIN },
    });
    expect(response.headers["access-control-allow-origin"]).toBe(
      ALLOWED_ORIGIN,
    );
  });

  it("does not allow other origins", async () => {
    app = await buildApp(testConfig());
    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "https://evil.example" },
    });
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("unknown routes", () => {
  it("return a friendly 404", async () => {
    app = await buildApp(testConfig());
    const response = await app.inject({
      method: "GET",
      url: "/does-not-exist",
    });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: { code: "NOT_FOUND", message: "We couldn't find that." },
    });
  });
});
