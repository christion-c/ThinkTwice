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
│   └── mobile/                  Expo app (iOS, Android, web)
│       ├── app/                 Screens and navigation (Expo Router, file-based)
│       ├── src/
│       │   ├── features/        One folder per feature: auth, expenses,
│       │   │                    categories, dashboard, forecasts
│       │   ├── components/      Shared UI components
│       │   ├── lib/             API client, Firebase setup
│       │   └── theme/           Colors, typography, spacing
│       └── tests/
├── services/
│   ├── api/                     Fastify REST API
│   │   ├── src/
│   │   │   ├── app.ts           Builds the Fastify app (used by tests too)
│   │   │   ├── server.ts        Starts the server
│   │   │   ├── config/          Environment variable loading and validation
│   │   │   ├── db/              Drizzle schema, database client, migrations
│   │   │   ├── plugins/         Auth, row-level security, rate limiting, errors
│   │   │   └── modules/         One folder per resource: users, categories,
│   │   │                        expenses, dashboard, forecasts
│   │   └── tests/
│   │       └── security/        Rule 13 access-control tests
│   └── ml/                      FastAPI forecasting service (Python)
│       ├── src/thinktwice_ml/
│       ├── tests/
│       └── pyproject.toml
├── packages/
│   └── shared/                  Zod schemas and TypeScript types shared by
│                                the app and the API (one source of truth)
├── docs/                        Project documentation
├── scripts/                     Repo tooling scripts (e.g. the commit-message check)
├── .github/workflows/           CI pipelines
├── compose.yaml                 Local dev: PostgreSQL, API, ML service
├── package.json                 Workspace scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json           Shared strict TypeScript settings
├── eslint.config.js
├── lefthook.yml                 Pre-commit checks
├── .gitattributes
├── .editorconfig
├── CLAUDE.md
└── README.md
```

Inside each API module, files follow the same pattern: `routes.ts` (HTTP endpoints), `service.ts` (business logic), `schemas.ts` (request and response validation).

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
- **Ruff** for linting and formatting.
- **mypy** in strict mode for type checking.

### Tests

| Part | Tool                                                                        |
| ---- | --------------------------------------------------------------------------- |
| App  | Jest + React Native Testing Library                                         |
| API  | Vitest, using Fastify's built-in request injection (no real network needed) |
| ML   | pytest                                                                      |

- The API tests run against a real PostgreSQL database (in Docker), not a mock, so row-level security is actually tested.
- The **Firebase Auth Emulator** issues real test tokens locally and in CI, so token verification is tested for real. It needs Java and the Firebase CLI.

### Pre-commit checks (Lefthook)

Before every commit, on the changed files only:

- format check (Prettier, Ruff)
- lint (ESLint, Ruff)
- type check

### CI (GitHub Actions)

On every push and pull request:

1. Install dependencies from the lockfiles.
2. Lint, format check and type check everything.
3. Run all tests, including the rule 13 security tests, against PostgreSQL and the Firebase Auth Emulator.
4. Audit dependencies for known vulnerabilities (`pnpm audit`, `pip-audit`).

Every step must pass before anything is merged into `main`.

### Dependency updates

**Dependabot** opens pull requests when dependencies have updates or security fixes.

### Line endings

`.gitattributes` stores all text files with LF line endings in the repo, which works on every operating system and stops the line-ending warnings on commit.

## Local development

- `docker compose watch` starts PostgreSQL, the API and the ML service, and reloads the API and ML service when their code changes.
- The Expo app runs outside Docker (`pnpm --filter mobile start`) so it can reach phone simulators, real devices and the browser.
- Secrets come from `.env` files that are never committed; each part has a `.env.example` (rule 9).

## Git workflow

- Day-to-day work happens on `christion`. Claude pushes there after every commit (see the Git workflow note in `CLAUDE.md`).
- `main` always holds a working, deployable version. Changes reach it only through pull requests from `christion`, and CI must pass.
- Commit messages follow **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
