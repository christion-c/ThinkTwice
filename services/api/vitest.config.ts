import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Applies migrations to the test database once before any test runs.
    globalSetup: ["tests/global-setup.ts"],
    // Database tests share one test database, so test files run one at a time.
    fileParallelism: false,
  },
});
