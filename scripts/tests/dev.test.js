import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { devPlan, labelLines } from "../dev.js";

describe("devPlan", () => {
  it("starts the database and applies migrations before anything else", () => {
    assert.deepEqual(
      devPlan().setup.map((step) => step.label),
      ["database", "migrations"],
    );
  });

  it("runs the API and the ML service alongside the app", () => {
    assert.deepEqual(
      devPlan().services.map((service) => service.label),
      ["api", "ml"],
    );
    assert.equal(devPlan().app.command, "pnpm --filter @thinktwice/app dev");
  });

  it("opens the Android emulator when asked", () => {
    assert.equal(
      devPlan({ android: true }).app.command,
      "pnpm --filter @thinktwice/app dev:android",
    );
  });
});

describe("labelLines", () => {
  it("labels every line, including the first", () => {
    assert.equal(labelLines("api", "one\ntwo\n"), "[api] one\n[api] two\n");
  });

  it("doesn't label the empty line after a final newline", () => {
    assert.equal(labelLines("ml", "only\n"), "[ml] only\n");
  });
});
