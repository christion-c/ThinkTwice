# ThinkTwice

ThinkTwice is an ADHD-friendly personal finance and habit-tracking app, originally built as an Atlas School CS2900 capstone. Instead of only reviewing past transactions, it uses machine learning to spot recurring spending habits, forecast their future cost, and suggest practical budget adjustments before small habits become big problems.

Example: "$35 on coffee this week" becomes "at this pace, about $140 on coffee by the end of the month."

Tagline: _Don't just track where your money went. See where it's taking you._

Christion is the sole developer. The capstone is finished and Christion has graduated; this is a from-scratch rebuild of the project, worked on at Christion's own pace with no deadline. A previous version is live at thinktwice.site, and the rebuild will replace it.

The agreed feature scope is in `docs/mvp.md`, the database design is in `docs/data-model.md`, the repo layout, tooling and workflow are in `docs/architecture.md`, and the look, accessibility rules and writing style are in `docs/design-guide.md`, and every API endpoint is documented in `docs/api.md` (update it with each endpoint change). Open problems and gaps are tracked in `docs/known-issues.md`: add new ones as they're found, and remove them in the same commit as the fix.

## Current status

_Update this section whenever a stage is finished or the plan changes._

- **Done:** all planning docs (MVP scope, data model, architecture, design guide), the setup guide, the known-issues list, and **setup stage 1: repo foundation** (pnpm workspace, strict TypeScript base config, ESLint, Prettier, Lefthook git hooks, GitHub Actions CI, Dependabot, `.gitattributes`). CI passes on `christion`.
- **Setup stage 2 done:** `packages/shared` (`@thinktwice/shared`): Zod schemas, types and default categories for users, categories and expenses, built to `dist/` with `tsc`, tested with Vitest.
- **`services/api` done** (3 steps):
  - Step 1: Fastify server skeleton: validated environment config, logging with credentials redacted, friendly JSON errors that never leak internals, security headers (helmet), CORS allowlist, rate limiting, 100 KB body limit and `GET /health`.
  - Step 2: database: PostgreSQL 18.6 in `compose.yaml`, least-privilege roles (`thinktwice_owner`, `thinktwice_app`), hand-written SQL migration `0001_initial_schema.sql` with forced row-level security on `users`, `categories` and `expenses`, a tested migration runner, Drizzle table definitions, and `withUserScope` for every user-data query. Tests in `services/api/tests/db/` prove the isolation against a real database.
  - Step 3: sign-in: Firebase ID token verification with `jose`, deny-by-default auth on every route, `requireIdentity` and `withSignedInUser`, and the reusable rule 13 harness `describeEndpointAuthentication` in `tests/security/`.
- **`services/ml` done:** FastAPI forecasting service (Python 3.14, uv). `POST /forecasts` projects each category's month-end total at the current pace (at least 3 expenses this month), in whole cents. Protected by a shared service token; `GET /health` is public.
- **`apps/app` done:** Expo SDK 58 app (iOS, Android, web) with Expo Router, the design guide's theme tokens (all four color modes) in `src/theme/`, a `Screen` layout component, and a placeholder welcome screen. It reuses the previous version's identifiers (`com.thinktwice.app`, `com.thinktwicefinance.app`, EAS project and owner) at version 2.0.0, so it replaces the old app in the stores. Checked on the Android emulator in light and dark mode.
- **Setup stage 2 is complete. Building v1 features** from `docs/mvp.md`.
- **Accounts, step 1 of 3 done:** `GET`, `POST`, `PATCH` and `DELETE /me` in the API (`services/api/src/modules/users/`). `POST /me` creates the account and the 12 default categories, idempotently. Step 2: the app's Firebase setup and email/password sign-up and sign-in (Firebase web config read from thinktwice.site's public bundle, with Christion's OK). Step 3: Google sign-in, with a local Android development build (needs JDK 21; confirm before installing).
- There are no v1 features yet: no endpoints besides `GET /health`, and only a placeholder welcome screen.

## Working with Christion

- **Explain in plain language.** Christion wants to understand every decision. Avoid unexplained jargon.
- **Propose, then build.** For plans and design decisions, give a recommendation (not just a list of options), write it up as a draft, and wait for Christion's approval before committing it. Pick sensible defaults for small choices and say which ones you picked.
- **Check real, current versions.** Many tools are newer than Claude's training data. Before adding or pinning a dependency, look up the actual latest version and its compatibility (e.g. `npm view <pkg> version peerDependencies`) instead of relying on memory.
- **Report honestly.** If a check fails or something can't be verified, say so and show it.

## Previous version of the app

`origin/main` still holds the previous (capstone) version of the app. It's a useful reference, but don't copy code from it without reviewing it against these rules. The design guide's color palette came from its `apps/frontend/lib/theme.ts`. See `docs/known-issues.md` before opening any pull request into `main`.

**It's live, with active users.** It runs in the Google Cloud / Firebase project **`thinktwice-dev-christion`**:

- Firebase Authentication (email/password and Google sign-in) and Firebase Hosting for thinktwice.site.
- API and ML service on Cloud Run (`thinktwice-backend`, `thinktwice-ml`, region `us-east4`).
- PostgreSQL on Cloud SQL (instance `thinktwice`, region `us-central1`), holding the users' data in the old schema.

**The rebuild reuses this Firebase project** (Christion's decision), so existing users keep their sign-in accounts. Rules for it:

- **Never touch the live project without asking Christion first**: no deploys, no changes to Firebase or Cloud SQL, no reads of production data.
- **Tests never use it.** They always use the placeholder project `demo-thinktwice` and test-signed tokens.
- Existing users' data must be migrated into the new schema before the rebuild goes live (see `docs/known-issues.md`).

## Common commands

- `pnpm install`: install all JavaScript dependencies and the git hooks.
- `pnpm format` / `pnpm format:check`: format with Prettier / check formatting.
- `pnpm lint`: run ESLint.
- `pnpm build`: build every package that has a build step (e.g. `packages/shared`).
- `pnpm typecheck`: build, then type check every package.
- `pnpm test`: run all tests.
- `docker compose up --detach --wait`: start the local PostgreSQL database (needed by the API and by `pnpm test`).
- `pnpm --filter @thinktwice/api db:migrate`: apply new database migrations.
- `pnpm --filter @thinktwice/api dev`: run the API locally with auto-reload.
- `pnpm --filter @thinktwice/ml dev`: run the ML service locally with auto-reload.
- `pnpm --filter @thinktwice/app android` / `web`: run the app on the Android emulator / in the browser.
- `pnpm audit:deps`: check JavaScript and Python dependencies for known vulnerabilities. (Plain `pnpm audit` only runs pnpm's built-in JavaScript audit.)

## Tooling decisions to preserve

These were deliberate security choices. Don't undo them without asking Christion:

- **pnpm's minimum release age stays on.** pnpm refuses packages published too recently, which protects against hijacked releases. If a brand-new version is blocked, pin a slightly older one instead of adding exceptions.
- **Install scripts are denied by default** (`allowBuilds` in `pnpm-workspace.yaml`). Only allow a package's install script after checking that it needs one.
- **GitHub Actions are pinned to full commit SHAs** (with the version in a comment), and CI runs with read-only permissions.
- **TypeScript stays on 6.0** until typescript-eslint supports TypeScript 7 (see `docs/known-issues.md`).
- **Never bypass the git hooks** (`--no-verify`). If a hook fails, fix the cause.
- **Database migrations are hand-written SQL** (Christion's choice; drizzle-kit's stable release depends on deprecated packages). Never edit an applied migration; add a new one. Keep `src/db/schema.ts` in sync with the SQL.
- **Token verification uses `jose`, not `firebase-admin`** (Christion's choice; `firebase-admin` depends on a deprecated package). Don't weaken any of its checks.
- **Routes are private by default.** Only add `config: { public: true }` to a route that genuinely needs no sign-in, and say so to Christion. Every new endpoint's tests must use `describeEndpointAuthentication` and include cross-user tests.
- **All user data goes through `withUserScope` or `withSignedInUser`.** Row-level security is forced on every user-data table, and the API connects only as `thinktwice_app`. Never give the API the owner or superuser connection, and never add `BYPASSRLS`.
- **The Docker image is pinned to its digest**, like the GitHub Actions.
- **Audit exceptions are by advisory ID only** (`auditConfig.ignoreGhsas` in `pnpm-workspace.yaml`), each with a written reason, only for development-only tools with no fix available, and approved by Christion. Never use `--ignore-unfixable` or ignore a vulnerability in anything that ships. Remove exceptions as soon as fixes exist.

## Source documents

Background context lives in the Word documents in `docs/background/`:

- `project-overview.docx`: the primary and most current description of the app.
- `one-page-project-overview.docx`: a condensed version of the above.
- `project-scoping-document.docx`: early brainstorming from when this was a team project. Its team roles and group commit rules no longer apply. Its feature ideas (Plaid bank connection, vehicle profile and fuel prediction, category spending limits, over-limit warnings) are possible features, not commitments.

## Tech stack

ThinkTwice runs on **iOS, Android and the web** from one codebase. It is designed mobile-first, but the web is a fully supported platform. This stack replaces the one in the Word documents.

- **App (iOS, Android, web):** React Native + Expo, Expo Router, TypeScript, TanStack Query
- **API:** Node.js + Fastify REST API, TypeScript, Zod for validation
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Firebase Authentication (email/password and Google) via the Firebase JS SDK; the API verifies Firebase ID tokens itself with `jose` (see `docs/architecture.md`)
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
