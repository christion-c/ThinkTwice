# ThinkTwice

ThinkTwice is an ADHD-friendly personal finance and habit-tracking app, originally built as an Atlas School CS2900 capstone. Instead of only reviewing past transactions, it uses machine learning to spot recurring spending habits, forecast their future cost, and suggest practical budget adjustments before small habits become big problems.

Example: "$35 on coffee this week" becomes "at this pace, about $140 on coffee by the end of the month."

Tagline: _Don't just track where your money went. See where it's taking you._

Christion is the sole developer. The capstone is finished and Christion has graduated; this is a from-scratch rebuild of the project, worked on at Christion's own pace with no deadline. A previous version is live at thinktwice.site, and the rebuild will replace it.

The agreed feature scope is in `docs/mvp.md`, the database design is in `docs/data-model.md`, the repo layout, tooling and workflow are in `docs/architecture.md`, and the look, accessibility rules and writing style are in `docs/design-guide.md`. Open problems and gaps are tracked in `docs/known-issues.md`: add new ones as they're found, and remove them in the same commit as the fix.

## Current status

_Update this section whenever a stage is finished or the plan changes._

- **Done:** all planning docs (MVP scope, data model, architecture, design guide), the setup guide, the known-issues list, and **setup stage 1: repo foundation** (pnpm workspace, strict TypeScript base config, ESLint, Prettier, Lefthook git hooks, GitHub Actions CI, Dependabot, `.gitattributes`). CI passes on `christion`.
- **Next: setup stage 2:** scaffold the apps and services from `docs/architecture.md`, one at a time, each verified and committed separately: `packages/shared`, `services/api` (with PostgreSQL in `compose.yaml`), `services/ml` (needs `uv` installed), then `apps/mobile` (Expo SDK 58). Then start building v1 features from `docs/mvp.md`.
- There is no application code yet.

## Working with Christion

- **Explain in plain language.** Christion wants to understand every decision. Avoid unexplained jargon.
- **Propose, then build.** For plans and design decisions, give a recommendation (not just a list of options), write it up as a draft, and wait for Christion's approval before committing it. Pick sensible defaults for small choices and say which ones you picked.
- **Check real, current versions.** Many tools are newer than Claude's training data. Before adding or pinning a dependency, look up the actual latest version and its compatibility (e.g. `npm view <pkg> version peerDependencies`) instead of relying on memory.
- **Report honestly.** If a check fails or something can't be verified, say so and show it.

## Previous version of the app

`origin/main` still holds the previous (capstone) version of the app. It's a useful reference, but don't copy code from it without reviewing it against these rules. The design guide's color palette came from its `apps/frontend/lib/theme.ts`. See `docs/known-issues.md` before opening any pull request into `main`.

## Common commands

- `pnpm install`: install all JavaScript dependencies and the git hooks.
- `pnpm format` / `pnpm format:check`: format with Prettier / check formatting.
- `pnpm lint`: run ESLint.
- `pnpm typecheck`: type check every package.
- `pnpm test`: run all tests.
- `pnpm audit`: check dependencies for known vulnerabilities.

## Tooling decisions to preserve

These were deliberate security choices. Don't undo them without asking Christion:

- **pnpm's minimum release age stays on.** pnpm refuses packages published too recently, which protects against hijacked releases. If a brand-new version is blocked, pin a slightly older one instead of adding exceptions.
- **Install scripts are denied by default** (`allowBuilds` in `pnpm-workspace.yaml`). Only allow a package's install script after checking that it needs one.
- **GitHub Actions are pinned to full commit SHAs** (with the version in a comment), and CI runs with read-only permissions.
- **TypeScript stays on 6.0** until typescript-eslint supports TypeScript 7 (see `docs/known-issues.md`).
- **Never bypass the git hooks** (`--no-verify`). If a hook fails, fix the cause.

## Source documents

Full context lives in the Word documents in `docs/`:

- `Project Overview.docx`: the primary and most current description of the app.
- `One Page Project Overview.docx`: a condensed version of the above.
- `Project Scoping Document.docx`: early brainstorming from when this was a team project. Its team roles and group commit rules no longer apply. Its feature ideas (Plaid bank connection, vehicle profile and fuel prediction, category spending limits, over-limit warnings) are possible features, not commitments.

## Tech stack

ThinkTwice runs on **iOS, Android and the web** from one codebase. It is designed mobile-first, but the web is a fully supported platform. This stack replaces the one in the Word documents.

- **App (iOS, Android, web):** React Native + Expo, Expo Router, TypeScript, TanStack Query
- **API:** Node.js + Fastify REST API, TypeScript, Zod for validation
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Firebase Authentication (email/password) via the Firebase JS SDK; the API verifies Firebase ID tokens
- **Machine learning:** Python + FastAPI service, called by the Node API
- **Dev environment:** Docker Compose (API + PostgreSQL + ML service)
- **Testing:** Jest + React Native Testing Library (app), Vitest (API), pytest (ML)
- **Version control:** Git + GitHub

## Platform requirements

- Every screen must work on phones, tablets and desktop browsers. Use responsive layouts and keep content centered and calm on wide screens.
- Only add dependencies that support iOS, Android **and** web. Check web support before adding any library.
- Use the Firebase JS SDK, not `@react-native-firebase` (native-only).
- Test changes on all three platforms.

## Domains and hosting

- `thinktwice.site`: the web app (Expo static web export, hosted on Firebase Hosting). The previous version is live there now. Don't deploy over it until the rebuild is ready.
- `api.thinktwice.site`: the Fastify API (host to be decided).
- The ML service is private. Only the API calls it; it is never exposed to the internet.

## Deliverables

- App for iOS, Android and the web (thinktwice.site) with an ADHD-friendly design
- Secure registration and authentication
- Expense and recurring-habit tracking
- Financial dashboards
- Transaction categorization (essential vs. discretionary)
- ML models that identify and forecast spending patterns
- Predictive insights and practical monthly-budget recommendations
- Awareness of nutritional spending habits (snacks, energy drinks, dining)
- REST API and PostgreSQL database
- Documentation and source code

## Design principles

- ADHD-friendly: information is clear, short and manageable, never overwhelming.
- Never shame the user. The tone is supportive, along the lines of "maybe don't do that."
- Understandable by users who are not technically experienced.

# Project Rules

These rules apply to all work on this project, by Christion or Claude. Follow them strictly.

## 1. Code has to work

- Never commit code that has not been run or tested.
- If something can't be verified, say so explicitly. Don't claim it works.

## 2. Code has to be clean

- Use clear, descriptive names for variables, functions and files.
- No dead code, commented-out code or leftover debug output.
- Keep formatting consistent with the surrounding code.

## 3. Code has to be modular

- Each function does one thing.
- Each file or module has one clear responsibility.
- Avoid duplication: extract shared logic instead of copy-pasting it.

## 4. Every function has a 1-line comment

- Put a single-line comment directly above (or as the docstring of) every function, explaining what it does for someone new to the code.

## 5. ABSOLUTELY NO deprecated practices

- Don't use deprecated APIs, libraries, language features or patterns.
- Use current, supported versions of dependencies.
- If unsure whether something is deprecated, check the official documentation before using it.

## 6. Always use best and most up-to-date practices

- Follow the current recommended approach from official documentation and style guides.
- Prefer modern language features and tooling over older equivalents.
- When there are multiple ways to do something, choose the one currently recommended, not just the one that works.

## 7. This is a production app: keep the project tree professional and easy to follow

- Follow the standard, conventional project layout for the language and framework in use.
- Group files by clear purpose (e.g. source, tests, config, docs, assets) in predictably named folders.
- Keep paths shallow and descriptive: a new developer should be able to guess where something lives.
- Use consistent naming for files and folders throughout the project.
- No stray files in the root: only top-level config and docs belong there.

## 8. Handle errors properly

- Never silently swallow errors: handle them, or let them propagate with useful context.
- Validate all external input (user input, API responses, files) at the boundary.
- Show users clear, friendly error messages; never expose stack traces or internal details to them.

## 9. Never commit secrets

- No API keys, passwords, tokens or credentials in the code or the git history.
- Load secrets from environment variables or a secrets manager.
- Keep `.env` files git-ignored, and commit a `.env.example` with placeholder values instead.

## 10. Log meaningfully

- Use a proper logging library with levels (debug, info, warning, error), not print statements.
- Log enough context to diagnose problems in production.
- Never log secrets or sensitive personal data.

## 11. Code must be tested

- New features and bug fixes come with tests.
- All tests must pass before code is committed or merged.
- Tests live in the project's standard test location and follow the same rules as the rest of the code.

## 12. Document everything needed to rebuild the dev environment

- `docs/setup.md` must always let a freshly reset computer get back to work quickly.
- Whenever a tool, package manager, global package, service, account, environment variable or setup step is added, removed or changed, update `docs/setup.md` in the same commit.
- Give exact install commands and record the versions in use.
- Pin versions in the project itself where possible (e.g. lockfiles, `engines` in `package.json`, Python requirements).
- List every secret in a `.env.example`, and note in `docs/setup.md` where its real value comes from.

## 13. User security is PARAMOUNT

No one may ever access information they are not allowed to see. This is financial data.

**Access control**

- Deny by default: every API endpoint requires a verified Firebase ID token unless it is explicitly public.
- Every database read and write is scoped to the signed-in user. Never trust a user ID, record ID or ownership claim sent by the client; always check that the record belongs to the requesting user.
- Return `404` (not `403`) for records that belong to someone else, so their existence isn't revealed.
- The ML service is reachable only from the API, never from the internet, and only receives the data it needs.

**Data protection**

- HTTPS everywhere. No sensitive data in URLs, logs or error messages.
- Store tokens securely on the device (`expo-secure-store` on iOS/Android); never put sensitive data in plain `AsyncStorage` or `localStorage`.
- Validate and size-limit every input; use parameterized queries only (Drizzle), never string-built SQL.
- Apply rate limiting to the API, with stricter limits on auth-related endpoints.
- Deleting an account permanently deletes all of that user's data.
- Database and service credentials follow least privilege.

**Testing (required)**

- Every endpoint has automated tests proving that:
  - requests with no token, an invalid token or an expired token are rejected;
  - user A cannot read, list, update or delete user B's data, including by guessing or swapping IDs;
  - invalid or malicious input is rejected safely.
- These tests run on every commit and must pass before merging.
- Dependencies are audited for known vulnerabilities (the JS package manager's audit command and `pip-audit`), and issues are fixed before release.
- When in doubt, choose the more secure option and ask.

## Git workflow note

- Claude pushes to `origin/christion` immediately after every commit it makes on the `christion` branch, without asking.
- Commits made manually are not pushed automatically. Push them yourself.
- Never push to `main` without asking first. `main` only changes through pull requests from `christion` with CI passing.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
