// Checks the static web export (dist/, built by `pnpm test:web`), because React Native Testing Library
// can't read web HTML. These are the accessibility basics screen readers on thinktwice.site depend on.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const html = await readFile(
  new URL("../../dist/index.html", import.meta.url),
  "utf8",
);

describe("exported welcome page", () => {
  it("declares the page language", () => {
    assert.match(html, /<html lang="en"/);
  });

  it("has the app's name as its one top-level heading", () => {
    const headings = [...html.matchAll(/<h1\b[^>]*>([^<]*)<\/h1>/g)].map(
      (match) => match[1],
    );
    assert.deepEqual(headings, ["ThinkTwice"]);
  });

  it("labels the logo for screen readers", () => {
    assert.match(
      html,
      /role="img"[^>]*aria-label="ThinkTwice logo"|aria-label="ThinkTwice logo"[^>]*role="img"/,
    );
  });

  it("shows the tagline", () => {
    assert.match(
      html,
      /Don&#x27;t just track where your money went\. See where it&#x27;s taking you\./,
    );
  });
});
