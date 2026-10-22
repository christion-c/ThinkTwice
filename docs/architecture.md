# ThinkTwice Architecture

_Status: approved. Last updated: 2026-10-22._

How the code is organized, how the pieces talk to each other, and the tooling that keeps it all working.

## How the pieces fit together

```
 iOS / Android / Web app (Expo)
        │  1. Signs in with Firebase Auth, receives an ID token
        │  2. Calls the API over HTTPS with the token
        ▼
 Fastify API  (api.thinktwice.site)
        │  Verifies the token, identifies the user,
        │  reads/writes only that user's data
        ├──────────────►  PostgreSQL (row-level security on)
        │
        └──────────────►  ML service (FastAPI, private network only)
                           Receives minimal, anonymous spending data,
                           returns forecasts
```

The app never talks to the database or the ML service directly. Everything goes through the API.

## Repository layout

One repository (a "monorepo") holds all three parts, managed as a **pnpm workspace**.

```
ThinkTwice/
├── apps/
│   └── app/                         Expo app (iOS, Android, web)
│       ├── app/                     Screens and navigation (Expo Router, file-based)
│       ├── assets/images/           App icons and logos (generated from docs/brand/)
│       ├── src/
│       │   ├── components/          Shared UI components (e.g. Screen)
│       │   ├── theme/               Colors, spacing, typography (docs/design-guide.md)
│       │   ├── types/               Type declarations (e.g. image imports)
│       │   ├── features/            (planned) One folder per feature: auth, expenses,
│       │   │                        categories, dashboard, forecasts
│       │   └── lib/                 (planned) API client, Firebase setup
│       └── tests/
│           ├── helpers/             Test utilities (render with providers)
│           └── web/                 Checks of the static web export's HTML
├── services/
│   ├── api/                         Fastify REST API
│   │   ├── src/
│   │   │   ├── app.ts               Builds the Fastify app (used by the server and tests)
│   │   │   ├── server.ts            Starts the server
│   │   │   ├── auth/                Firebase ID token verification
│   │   │   ├── config/              Environment variable loading and validation
│   │   │   ├── db/                  Database code: client, Drizzle tables, user scope,
│   │   │   │                        migration runner
│   │   │   ├── errors/              Error types that map to HTTP responses
│   │   │   ├── plugins/             Auth (deny by default), database, error handling
│   │   │   └── modules/             One folder per resource (health; planned: users,
│   │   │                            categories, expenses, dashboard, forecasts)
│   │   ├── database/
│   │   │   ├── init/                Creates the database roles and databases in Docker
│   │   │   └── migrations/          Hand-written SQL migrations (the schema's source of truth)
│   │   └── tests/
│   │       ├── db/                  Row-level security, privileges, constraints, migrations
│   │       ├── security/            Rule 13 auth tests and the reusable endpoint harness
│   │       └── helpers/             Test app, database, token and fixture helpers
│   └── ml/                          FastAPI forecasting service (Python)
│       ├── src/thinktwice_ml/       Service code (forecasting, routes, schemas, security)
│       ├── tests/
│       └── pyproject.toml           Python dependencies and tool settings (uv.lock pins them)
├── packages/
│   └── shared/                      Zod schemas and TypeScript types shared by
│                                    the app and the API (one source of truth)
├── docs/                            Project documentation
│   ├── brand/                       Logo source files (SVG) and the original PNG
│   └── background/                  The original Word documents (historical context)
├── scripts/                         Repo tooling scripts (e.g. the commit-message check)
├── .github/                         CI workflow and Dependabot settings
├── compose.yaml                     Local dev services (PostgreSQL for now)
├── .env.example                     Local database passwords for compose.yaml
├── package.json                     Workspace scripts (lint, typecheck, test, audit:deps)
├── pnpm-workspace.yaml              Workspace packages and dependency security settings
├── tsconfig.base.json               Shared strict TypeScript settings
├── eslint.config.js
├── .prettierrc.json
├── lefthook.yml                     Git hooks (pre-commit checks, commit messages)
├── .nvmrc                           Node.js version
├── .gitattributes                   Line endings
├── .editorconfig
├── CLAUDE.md                        Project context and rules (read by Claude every session)
└── README.md
```

Inside each API module, files follow the same pattern: `routes.ts` (HTTP endpoints) and `service.ts` (business logic). Request and response schemas come from `packages/shared` so the app uses the same ones; a module adds its own `schemas.ts` only for shapes the app never sees. Every endpoint is documented in `docs/api.md`.

## Tooling

### Versions

| Tool       | Version | Pinned in                             |
| ---------- | ------- | ------------------------------------- |
| Node.js    | 24 LTS  | `.nvmrc`, `engines` in `package.json` |
| pnpm       | 12.14   | `packageManager` in `package.json`    |
| TypeScript | 6.0     | `package.json` (see known issues)     |
| Python     | 3.14    | `pyproject.toml`, `.python-version`   |
| PostgreSQL | 18      | `compose.yaml`                        |

### TypeScript (app, API, shared)

- **TypeScript** in strict mode, from a shared `tsconfig.base.json`.
- **ESLint** (flat config) for code quality, with the React, React Hooks and TypeScript rule sets.
- **Prettier** for formatting.

### Python (ML service)

- **uv** for installing Python, managing dependencies and locking versions (`uv.lock`).
- **Ruff** for linting and formatting, with every rule set enabled (`select = ["ALL"]`), including docstrings on every function (rule 4) and security checks.
- **mypy** in strict mode for type checking, with the Pydantic plugin.
- **pytest** for tests, with FastAPI's test client on **httpx2** (Starlette deprecated using it with the original httpx).
- **pip-audit** for known vulnerabilities.
- `services/ml/package.json` exists only so the root `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm audit:deps` also run the Python checks. Python dependencies live in `pyproject.toml`.

### ML service security

- Only the API may call it: every endpoint except `GET /health` requires a shared secret (`ML_SERVICE_TOKEN`, at least 32 characters) as a Bearer token, compared in constant time.
- It never receives IDs, emails or notes; only category name and type, amount and date (`schemas.py`). Unknown fields are rejected and every value is size-limited.
- Interactive docs and the OpenAPI schema are turned off.

### Tests

| Part   | Tool                                                                                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------- |
| App    | Jest + jest-expo + React Native Testing Library (iOS and Android); the static web export is checked with `node:test` |
| API    | Vitest, using Fastify's built-in request injection (no real network needed)                                          |
| Shared | Vitest                                                                                                               |
| ML     | pytest                                                                                                               |

- The API tests run against a real PostgreSQL database (in Docker), not a mock, so row-level security is actually tested. They use a separate `thinktwice_test` database, so they never touch development data.
- Sign-in is tested with **real RS256-signed tokens** made from a test key pair (`tests/helpers/tokens.ts`), so signature, audience, issuer and expiry checks are all genuinely exercised. No Firebase emulator, CLI or Java is needed.

- **App tests run on iOS and Android** with React Native Testing Library. It can't read web HTML, so `pnpm --filter @thinktwice/app test:web` builds the static web export and checks the real HTML (`apps/app/tests/web/`): page language, headings and screen reader labels.
- `apps/app/tests/theme.test.ts` checks every color token against WCAG 2.2 AA contrast in all four color modes, so the design guide's contrast rule can't regress.
- On the web, React Native components become real HTML: `role="heading"` with `aria-level` becomes `<h1>`, and images need `role="img"` with `aria-label` (React Native Web ignores `alt`). Use `role` and `aria-*` props, not the older `accessibility*` props.

- `pnpm lint` and `pnpm typecheck` both run `pnpm build` first: type-aware linting needs `packages/shared`'s compiled types, which a clean checkout (like CI's) doesn't have.

### Pre-commit checks (Lefthook)

Before every commit, on the changed files only:

- format check (Prettier, Ruff)
- lint (ESLint, Ruff)
- type check

### CI (GitHub Actions)

On every push and pull request:

1. Install dependencies from the lockfiles.
2. Lint, format check and type check everything.
3. Run all tests, including the rule 13 security tests, against a real PostgreSQL database.
4. Audit dependencies for known vulnerabilities (`pnpm audit:deps`, which runs `pnpm audit` and `pip-audit`).

Every step must pass before anything is merged into `main`.

### Dependency updates

**Dependabot** opens pull requests when dependencies have updates or security fixes.

### Line endings

`.gitattributes` stores all text files with LF line endings in the repo, which works on every operating system and stops the line-ending warnings on commit.

## Running TypeScript

- **API (development):** Node.js 24 runs the TypeScript source directly with its built-in type stripping (`node --watch src/server.ts`), so no extra runner like `tsx` is needed. The API's `tsconfig.json` enables `erasableSyntaxOnly` so only syntax Node can strip is allowed, and relative imports use `.ts` extensions.
- **API (production):** `tsc` compiles to `dist/` and rewrites the `.ts` imports to `.js` (`rewriteRelativeImportExtensions`); `node dist/server.js` runs it.
- **Shared package:** compiled to `dist/` with `tsc`. The app and API import the compiled output, so `pnpm build` runs before type checking.

## Authentication

### In the API

- The app signs users in with Firebase Authentication and sends the Firebase **ID token** with every request (`Authorization: Bearer <token>`).
- The API verifies the token itself with **jose**, following Firebase's documented checks for third-party JWT libraries: RS256 signature against Google's published keys, audience = our Firebase project ID, issuer = `https://securetoken.google.com/<project ID>`, not expired, issued and signed in no later than now, and a non-empty subject (the Firebase UID). `firebase-admin` isn't used because it depends on a deprecated package (rule 5).
- **Deny by default:** an `onRequest` hook (`src/plugins/auth.ts`) rejects every request without a valid token with `401`, before the body is even read. A route is public only if it sets `config: { public: true }` (today, only `GET /health`).
- Handlers get the caller from `requireIdentity(request)` and run all user-data queries through `withSignedInUser(app.db, firebaseUid, …)`, which looks up the user's ID inside their own row-level security scope.
- **Every new endpoint's tests must** call `describeEndpointAuthentication` (`tests/security/endpoint-security.ts`), which checks 15 kinds of missing, forged or invalid tokens, **and** add cross-user tests proving user A can't read, list, update or delete user B's data through it.

### In the app

- **Firebase JS SDK, Authentication only.** The app installs `firebase` but never Firestore: Firestore is a required dependency of the `firebase` package, but it pins a vulnerable `@grpc/grpc-js`, so `pnpm-workspace.yaml` excludes it (`overrides`). Remove that exclusion only if Firestore is ever needed.
- **Where the sign-in is kept:**
  - **iOS and Android:** only in the device's encrypted keychain/keystore (`expo-secure-store`, readable only while unlocked and never backed up), through `src/lib/secure-storage.ts`. It splits Firebase's saved session into chunks under the secure store's 2048-byte limit and encodes keys into its allowed characters.
  - **Web:** Firebase's standard browser persistence (IndexedDB). Browsers have no keychain; the session is protected by the browser's same-origin rules.
- **Account setup:** after any sign-in, `AuthProvider` (`src/features/auth/auth-provider.tsx`) calls `POST /me` with the device's time zone. Only once that succeeds does the user see the app.
- **Screens by sign-in state:** the root layout uses Expo Router's `Stack.Protected`. Signed-out users can only reach `(auth)` (sign-in, sign-up, password reset); users whose account is being set up only `account-setup`; only fully set-up users reach `(app)`. The native splash screen stays up until the saved sign-in has been checked, so the sign-in form never flashes.
- **API calls** go through `src/lib/api.ts`, which adds the ID token, validates responses against the shared schemas, and turns failures into `ApiError`s with messages safe to show.
- **Typed routes are off** (Expo's `experiments.typedRoutes`): their types are only generated by `expo start`, which CI never runs, so CI and local type checks would disagree. Links are checked instead by the web test (`tests/web/`), which confirms every link points at an exported page.

## Database migrations

- Migrations are **hand-written SQL files** in `services/api/database/migrations/`, named `NNNN_description.sql` and applied in order. drizzle-kit isn't used because its stable release depends on deprecated packages (rule 5), and hand-written SQL gives exact control over row-level security and roles (rule 13).
- `pnpm --filter @thinktwice/api db:migrate` applies new migrations as `thinktwice_owner`. Each runs in its own transaction and is recorded with a checksum in `schema_migrations`; an advisory lock stops two runs at once.
- **Never edit a migration after it has been applied.** The runner refuses to run if an applied file's checksum changes. Add a new migration instead.
- Drizzle table definitions in `services/api/src/db/schema.ts` must match the SQL. `tests/db/schema.test.ts` fails if they drift apart.

## Local development

- `docker compose up --detach --wait` starts PostgreSQL (listening only on `127.0.0.1`). The API and ML service will be added to `compose.yaml` later; for now the API runs directly with `pnpm --filter @thinktwice/api dev`.
- The Expo app runs outside Docker (`pnpm --filter @thinktwice/app start`) so it can reach phone simulators, real devices and the browser.
- Secrets come from `.env` files that are never committed; each part has a `.env.example` (rule 9).

## Git workflow

- Day-to-day work happens on `christion`. Claude pushes there after every commit (see the Git workflow note in `CLAUDE.md`).
- `main` always holds a working, deployable version. Changes reach it only through pull requests from `christion`, and CI must pass.
- Commit messages follow **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
