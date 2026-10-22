import { buildApp } from "../../src/app.ts";
import type { Config } from "../../src/config/env.ts";
import { TEST_FIREBASE_PROJECT_ID, testSigningKeys } from "./tokens.ts";

export const ALLOWED_ORIGIN = "http://localhost:8081";

/** Returns a quiet configuration for tests, with any settings overridden. */
export function testConfig(overrides: Partial<Config> = {}): Config {
  return {
    nodeEnv: "test",
    host: "127.0.0.1",
    port: 0,
    logLevel: "silent",
    corsOrigins: [ALLOWED_ORIGIN],
    trustProxy: false,
    rateLimitMax: 1000,
    firebaseProjectId: TEST_FIREBASE_PROJECT_ID,
    // The connection pool only connects when a query runs, so tests that don't touch the database never use this.
    databaseUrl: "postgresql://unused:unused@127.0.0.1:1/unused",
    ...overrides,
  };
}

/** Builds the app for tests: quiet logging, and only tokens signed with the test key are trusted. */
export function buildTestApp(overrides: Partial<Config> = {}) {
  return buildApp(testConfig(overrides), {
    firebaseSigningKeys: testSigningKeys,
  });
}
