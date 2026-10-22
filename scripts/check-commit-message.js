// Rejects commit messages that don't follow Conventional Commits (used by the commit-msg hook).
import { readFileSync } from "node:fs";

const TYPES = [
  "feat",
  "fix",
  "docs",
  "test",
  "refactor",
  "chore",
  "style",
  "perf",
  "build",
  "ci",
  "revert",
];
const PATTERN = new RegExp(
  String.raw`^(${TYPES.join("|")})(\([a-z0-9-]+\))?!?: \S`,
);
const EXEMPT = /^(Merge|Revert) /;

// Returns true when the commit message's first line is valid or exempt.
export function isValidCommitMessage(message) {
  const firstLine = message.split(/\r?\n/, 1)[0] ?? "";
  return EXEMPT.test(firstLine) || PATTERN.test(firstLine);
}

if (import.meta.main) {
  const message = readFileSync(process.argv[2] ?? "", "utf8");
  if (!isValidCommitMessage(message)) {
    console.error(
      `Commit message must follow Conventional Commits, e.g. "feat: add expense form".\n` +
        `Allowed types: ${TYPES.join(", ")}.`,
    );
    process.exit(1);
  }
}
