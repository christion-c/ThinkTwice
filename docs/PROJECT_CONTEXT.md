# ThinkTwice Project Context

Last audited: 2026-08-11

Audited base revision: `14e4c9d` on `Christion`

## Team ownership

- Backend: Christion Callahan
- Frontend: Parker Lewis and James Lewis
- Machine learning: Gabriel Phipps

## Stack

- Expo SDK 54 / React Native frontend
- Node 22 / Express / TypeScript backend
- PostgreSQL 17
- Firebase Authentication
- Python 3.12 / FastAPI ML service (pandas + scikit-learn for forecasting)
- Docker Compose development environment

## Authentication model

- The frontend signs users in with Firebase Authentication.
- The backend verifies Firebase ID tokens with Firebase Admin.
- Firebase Admin uses `applicationDefault()`.
- Local development is intended to use ADC impersonating
  `thinktwice-dev-backend`.
- Service-account private-key JSON is prohibited.
- Docker mounts ADC read-only from `GOOGLE_ADC_PATH`.

## Data flow (new as of 2026-08-11)

- The frontend logs daily budget/habit check-ins (fuel cost, food cost,
  miles driven, meals) to the backend's `budget_entries` table
  (`POST /budget-entries`, owned by the user).
- The backend is now the ML service's only caller: `GET /predictions`
  loads the user's recent entries and forwards them to the ML service's
  `POST /predict`, which returns a forecast (a plain average below 3
  logged entries, a per-cost `LinearRegression` on `[miles_driven, meals]`
  at 3+). The frontend never calls the ML service directly.
- Vehicle profiles remain persisted through the backend/PostgreSQL API, as
  before.
- Frontend preferences (color mode, high contrast, compact cards, quick
  hints) and finance/fuel manual inputs now persist locally via
  `@react-native-async-storage/async-storage` instead of resetting on
  every reload.

## Verified working on 2026-08-11

- Backend: clean typecheck, build, and `npm test` (27 tests: auth
  middleware unit tests with `node:test` module mocking, zod schema unit
  tests, and Postgres-backed integration tests for migrations and the
  vehicle/budget repositories, including cross-user ownership checks).
  Verified against both a disposable local Postgres container and via a
  built production Docker image with no ADC configured (public routes and
  401 rejection work; protected routes correctly require a token).
- Security: `helmet` and `express-rate-limit` added to the backend;
  verified security headers present and rate limiting active via a live
  container.
- ML: `pytest` suite (6 tests) covering `/health`, the average-fallback
  and regression prediction paths, and input validation. `pip check` and
  `pip-audit` clean. Verified end-to-end via a built production Docker
  image (`/health` and `/predict` both respond correctly).
- Frontend: clean `npm ci`, lint, typecheck, `expo install --check`, and
  web export (all 14 routes, including the new `/nutrition` screen).
- Backend, frontend, and ML Docker images build (dev and, for
  backend/ML, production stages).
- `docker compose config` validates with the updated compose file.
- `npm audit` (backend, frontend) and `pip-audit` (ML) re-checked:
  vulnerability counts unchanged from the 2026-08-09 audit (see below) —
  no regressions introduced by the new dependencies.

## Known incomplete or external work

- The Expo SDK 54 dependency tree retains 24 npm audit findings (13 high and 11
  moderate). Resolving the remaining Metro/Expo findings requires a coordinated
  major Expo upgrade; never run `npm audit fix --force` as an unattended fix.
- Firebase Admin retains six moderate transitive `uuid` findings. npm's proposed
  automated fix is a breaking downgrade of Firebase Admin and was not applied.
- Google OAuth requires provider configuration and a native development build.
- A valid Firebase-token flow and native Android/iOS builds have still not been
  exercised (needs a real Firebase project and a development build).
- Local ADC must be verified as an impersonated-service-account credential on
  each developer machine.
- Notification preferences (`settings/notifications.tsx`) persist locally but
  have no delivery mechanism yet — there's no push service wired up.
- No global font-scale/text-size accessibility control; only high contrast
  mode was added. Every screen still hardcodes its own `fontSize` values.
- Account deletion is not implemented (read-only account info + sign-out only).

## History and operational notes

- The frontend lockfile was updated; a clean Node 22 `npm ci` succeeds.
- A nonbreaking lockfile-only npm remediation reduced the frontend audit from 28
  findings to 24 without changing Expo SDK 54.
- The frontend Dockerfile previously retained a recursive workspace `chown`; it
  was removed after the 2026-08-09 audit.
- VS Code forwarding previously occupied ports 5433 and 8000. Docker owns the
  published development ports, so automatic devcontainer forwarding is disabled.
- `@types/node` was pinned to `^22.x` on 2026-08-11 (was `^26.1.1`, mismatched
  against the Node 22 runtime).
- `services/ml/data.py` and `update.py` (exploratory, uncovered by
  `requirements.txt`) were removed on 2026-08-11; their logic is now the real
  `/predict` implementation in `app/main.py`.
- `apps/frontend/components/SimpleCardPage.tsx` was removed on 2026-08-11 after
  its last three callers (the accessibility, notifications, and account
  settings screens) became real functional screens instead of placeholders.
- CI now runs backend (`npm test` against a Postgres service container) and ML
  (`pytest`) test suites, not just typecheck/build/lint.
