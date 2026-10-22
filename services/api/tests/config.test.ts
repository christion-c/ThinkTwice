import { describe, expect, it } from "vitest";

import { loadConfig } from "../src/config/env.ts";

describe("loadConfig", () => {
  it("uses safe defaults when nothing is set", () => {
    expect(loadConfig({})).toEqual({
      nodeEnv: "development",
      host: "127.0.0.1",
      port: 3000,
      logLevel: "info",
      corsOrigins: [],
      trustProxy: false,
      rateLimitMax: 100,
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
    });
    expect(config).toEqual({
      nodeEnv: "production",
      host: "0.0.0.0",
      port: 8080,
      logLevel: "warn",
      corsOrigins: ["https://thinktwice.site", "http://localhost:8081"],
      trustProxy: true,
      rateLimitMax: 50,
    });
  });

  it.each([
    { PORT: "not-a-number" },
    { PORT: "70000" },
    { NODE_ENV: "staging" },
    { LOG_LEVEL: "loud" },
    { CORS_ORIGINS: "not a url" },
    { TRUST_PROXY: "yes" },
    { RATE_LIMIT_MAX: "0" },
  ])("fails fast on the invalid setting %o", (env) => {
    expect(() => loadConfig(env)).toThrow("Invalid environment configuration");
  });
});
