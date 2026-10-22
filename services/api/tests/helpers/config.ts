import type { Config } from "../../src/config/env.ts";

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
    // The connection pool only connects when a query runs, so tests that don't touch the database never use this.
    databaseUrl: "postgresql://unused:unused@127.0.0.1:1/unused",
    ...overrides,
  };
}
