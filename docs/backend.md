# Backend

Express/TypeScript REST API — the only thing in this project that talks to PostgreSQL directly, and the only thing that talks to the ML service. See the root [`README.md`](../README.md#architecture) for how this fits into the rest of the stack, [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for project history, and [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for open issues.

First-time environment setup (installing tools, authenticating `gcloud`, filling in `.env`) lives in the root [`README.md`](../README.md). This file covers the backend's own architecture and how to run and test it. Paths below are relative to `apps/backend/`.

## Architecture

```
src/
  modules/<feature>/
    <feature>.routes.ts       Express router - auth, validation, response shaping
    <feature>.repository.ts   Database access for this feature
  lib/
    route-helpers.ts          withCurrentUser, asyncHandler, respondNotFound, etc. - shared by every route
    db-helpers.ts             expectOneRow, numericOrNull - shared by every repository
  middleware/                 requireAuth (Firebase token verification), requireInternalService, syncCurrentUser
  config/                     env.ts (validated startup config), firebase.ts
  db/
    pool.ts                   the pg Pool
    migrations/                one file per migration, auto-run at startup
```

Feature modules follow the same `<feature>.routes.ts` + `<feature>.repository.ts` split: `budget`, `daily-driving-log`, `fill-up-history`, `finance`, `money-plan`, `users`, `vehicles`. `auth` and `health` have routes only (no tables), and `predictions` has a client for the ML service instead of a repository. Routes never touch the database directly; repositories never touch `request`/`response`.

`modules/predictions/predictions.client.ts` is the backend's client for the ML service (`requestForecast` for `/predict`, `requestPreview` for the debug-only `/ml-preview` flow). The frontend never calls the ML service directly — every request goes through here, authenticated with the caller's verified identity, so the ML service's internal token never needs to leave the backend.

## Migrations

Migrations in `src/db/migrations/` run automatically every time the server starts (`runMigrations()` in `server.ts`, before the HTTP server begins listening) — there's no separate `npm run migrate` step. The migration runner is idempotent and takes a Postgres advisory lock, so it's safe for multiple instances to start concurrently. To add one, add a new file to `src/db/migrations/` following the existing numbering.

## Environment variables

Validated once at startup (`src/config/env.ts`) — the process refuses to start if a required one is missing or malformed.

| Variable                 | Required | Notes                                                                                        |
| ------------------------ | -------- | -------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | yes      | no default - the app won't start without a real database                                     |
| `INTERNAL_SERVICE_TOKEN` | yes      | shared secret for service-to-service routes (the ML service calling back into this API)      |
| `ML_SERVICE_URL`         | no       | defaults to `http://ml:8000` (the Docker Compose service name); set explicitly in production |
| `CORS_ORIGIN`            | no       | defaults to `*`; production sets this to the real frontend origin(s)                         |
| `PORT`                   | no       | defaults to `3000`                                                                           |
| `NODE_ENV`               | no       | `development` / `test` / `production`, defaults to `development`                             |

## Running and testing locally

Through Docker (recommended — see the root README for the full local-dev flow):

```bash
docker compose --profile frontend --profile ml up --watch
```

Directly on the host, if you'd rather not use Docker for backend work specifically:

```bash
cd apps/backend
npm ci
npm run typecheck
npm test
```

`npm test` needs a reachable Postgres — either the one `docker compose up` already started (`localhost:5433`), or point `DATABASE_URL` at your own. Tests that need the database self-skip with a clear message if it isn't reachable, rather than failing.

## Deploying

See [deploying.md](deploying.md) for the build/push/deploy commands, the
post-deploy checks, and the GCP/Firebase resource table.
