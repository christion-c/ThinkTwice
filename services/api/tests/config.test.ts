import { describe, expect, it } from "vitest";

import { loadConfig } from "../src/config/env.ts";

const DATABASE_URL =
  "postgresql://thinktwice_app:secret@127.0.0.1:5432/thinktwice";
const FIREBASE_PROJECT_ID = "thinktwice-prod";
const REQUIRED = { DATABASE_URL, FIREBASE_PROJECT_ID };

describe("loadConfig", () => {
  it("uses safe defaults for everything except the required settings", () => {
    expect(loadConfig(REQUIRED)).toEqual({
      nodeEnv: "development",
      host: "127.0.0.1",
      port: 3000,
      logLevel: "info",
      corsOrigins: [],
      trustProxy: false,
      rateLimitMax: 100,
      firebaseProjectId: FIREBASE_PROJECT_ID,
      databaseUrl: DATABASE_URL,
    });
  });

  it("reads every setting from the environment", () => {
    const config = loadConfig({
      NODE_ENV: "production",
      HOST: "0.0.0.0",
      PORT: "8080",
      LOG_LEVEL: "warn",
      CORS_ORIGINS: "https://thinktwice.site, http://localhost:8081",
      TRUST_PROXY: "true",
      RATE_LIMIT_MAX: "50",
      ...REQUIRED,
    });
    expect(config).toEqual({
      nodeEnv: "production",
      host: "0.0.0.0",
      port: 8080,
      logLevel: "warn",
      corsOrigins: ["https://thinktwice.site", "http://localhost:8081"],
      trustProxy: true,
      rateLimitMax: 50,
      firebaseProjectId: FIREBASE_PROJECT_ID,
      databaseUrl: DATABASE_URL,
    });
  });

  it("requires a database URL and a Firebase project ID", () => {
    expect(() => loadConfig({ FIREBASE_PROJECT_ID })).toThrow("DATABASE_URL");
    expect(() => loadConfig({ DATABASE_URL })).toThrow("FIREBASE_PROJECT_ID");
  });

  it.each([
    { PORT: "not-a-number" },
    { PORT: "70000" },
    { NODE_ENV: "staging" },
    { LOG_LEVEL: "loud" },
    { CORS_ORIGINS: "not a url" },
    { TRUST_PROXY: "yes" },
    { RATE_LIMIT_MAX: "0" },
    { DATABASE_URL: "https://example.com/db" },
    { FIREBASE_PROJECT_ID: "Not A Project" },
    { FIREBASE_PROJECT_ID: "x" },
  ])("fails fast on the invalid setting %o", (overrides) => {
    expect(() => loadConfig({ ...REQUIRED, ...overrides })).toThrow(
      "Invalid environment configuration",
    );
  });
});
