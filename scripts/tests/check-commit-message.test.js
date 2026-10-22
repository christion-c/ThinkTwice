import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isValidCommitMessage } from "../check-commit-message.js";

describe("isValidCommitMessage", () => {
  it("accepts Conventional Commits messages", () => {
    assert.ok(isValidCommitMessage("feat: add expense form"));
    assert.ok(isValidCommitMessage("fix(api): reject expired tokens"));
    assert.ok(isValidCommitMessage("refactor!: rename categories table"));
    assert.ok(isValidCommitMessage("docs: update setup\n\nLonger body text."));
  });

  it("accepts merge and revert commits", () => {
    assert.ok(
      isValidCommitMessage("Merge pull request #21 from christion-c/christion"),
    );
    assert.ok(isValidCommitMessage('Revert "feat: add expense form"'));
  });

  it("rejects messages without a valid type", () => {
    assert.ok(!isValidCommitMessage("Add expense form"));
    assert.ok(!isValidCommitMessage("feature: add expense form"));
    assert.ok(!isValidCommitMessage("feat add expense form"));
    assert.ok(!isValidCommitMessage("feat: "));
    assert.ok(!isValidCommitMessage(""));
  });
});
