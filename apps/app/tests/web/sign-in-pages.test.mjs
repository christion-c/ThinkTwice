// Checks the static web export (dist/, built by `pnpm test:web`), because React Native Testing Library
// can't read web HTML. Covers the accessibility basics screen readers and password managers on thinktwice.site
// depend on, and that links between pages point at routes that exist.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const DIST = new URL("../../dist/", import.meta.url);

/** Reads one exported page's HTML. */
function readPage(route) {
  return readFile(new URL(`${route}.html`, DIST), "utf8");
}

/** Returns every input tag on a page. */
function inputs(html) {
  return [...html.matchAll(/<input\b[^>]*>/g)].map((match) => match[0]);
}

const PAGES = {
  "sign-in": {
    heading: "Welcome back",
    button: "Sign in",
    links: ["/forgot-password", "/sign-up"],
  },
  "sign-up": {
    heading: "Create your account",
    button: "Create account",
    links: ["/sign-in"],
  },
  "forgot-password": {
    heading: "Reset your password",
    button: "Send reset link",
    links: ["/sign-in"],
  },
};

for (const [route, expected] of Object.entries(PAGES)) {
  describe(`/${route}`, async () => {
    const html = await readPage(route);

    it("declares the page language", () => {
      assert.match(html, /<html lang="en"/);
    });

    it("has exactly one top-level heading", () => {
      const headings = [...html.matchAll(/<h1\b[^>]*>([^<]*)<\/h1>/g)].map(
        (match) => match[1],
      );
      assert.deepEqual(headings, [expected.heading]);
    });

    it("labels the logo for screen readers", () => {
      assert.match(html, /aria-label="ThinkTwice logo"/);
    });

    it("labels every field and tells password managers what it's for", () => {
      const fields = inputs(html);
      assert.ok(fields.length > 0);
      for (const field of fields) {
        assert.match(field, /aria-label="[^"]+"/);
        assert.match(
          field,
          /autocomplete="(email|current-password|new-password)"/i,
        );
      }
    });

    it("never autocorrects, spell-checks or capitalizes email addresses and passwords", () => {
      for (const field of inputs(html)) {
        assert.match(field, /autocapitalize="none"/i);
        assert.match(field, /autocorrect="off"/i);
        assert.match(field, /spellcheck="false"/i);
      }
    });

    it("has a named main button", () => {
      assert.match(html, new RegExp(`aria-label="${expected.button}"`));
    });

    it("links only to pages that exist", async () => {
      for (const link of expected.links) {
        assert.match(html, new RegExp(`href="${link}"`));
        await assert.doesNotReject(
          readPage(link.slice(1)),
          `${link} should be an exported page`,
        );
      }
    });
  });
}
