# ThinkTwice Project Context

Last audited: 2026-08-19

## Team ownership

The capstone team dissolved after presentation (Aug 2026):

- Christion Callahan now owns the whole project (backend, frontend, and ML).
- Parker Lewis occasionally contributes, most often to the frontend.
- Gabriel Phipps and James Lewis are no longer on the project. Historical
  entries below that name them as owners of a given area are preserved as a
  record of what was true at the time, not current fact.

## Stack

- Expo SDK 54 / React Native frontend, now styled with Tailwind CSS via
  NativeWind (see the 2026-08-19 entry below) rather than StyleSheet.create
- Node 22 / Express / TypeScript backend
- PostgreSQL 17
- Firebase Authentication
- Python 3.12 / FastAPI ML service - pure-Python recency-weighted average
  forecasting (see the 2026-08-13 entry below); no longer uses pandas or
  scikit-learn despite what earlier entries in this log describe
- Docker Compose development environment

## Authentication model

- The frontend signs users in with Firebase Authentication.
- The backend verifies Firebase ID tokens with Firebase Admin.
- Firebase Admin uses `applicationDefault()`.
- Local development is intended to use ADC impersonating
  `thinktwice-dev-backend`.
- Service-account private-key JSON is prohibited.
- Docker mounts ADC read-only from `GOOGLE_ADC_PATH`.

## Data flow (as of 2026-08-11, after merging `Christion` with `main`)

- The frontend logs daily budget/habit check-ins (fuel cost, food cost,
  miles driven, meals) to the backend's `budget_entries` table
  (`POST /budget-entries`, owned by the user).
- The backend is the ML service's primary caller for the supported path:
  `GET /predictions` loads the user's recent `budget_entries` and forwards
  them to the ML service's `POST /predict`, which returns a forecast (a
  plain average below 3 logged entries; a recency-weighted average of each
  entry's own fuel-cost-per-mile at 3+ — despite the `method: "linear_
  regression"` label kept for API-shape stability, this has not used
  scikit-learn's `LinearRegression` since Parker's rewrite; see the
  2026-08-13 entry below).
- Vehicle profiles are persisted through the backend/PostgreSQL API.
- Finance planner inputs now persist server-side per user (`finance_inputs`
  table, `GET`/`PUT /finance/inputs`), with a local AsyncStorage cache for
  instant load and a debounced (1500ms) cloud sync — not client-only
  anymore.
- Fuel fill-ups are separately logged to a `fill_up_history` table
  (`POST /fill-up-history`) that feeds a second, prototype prediction path:
  the ML service's `GET /ml-preview` blends a math-based forecast with a
  user's fill-up history (fetched from the backend's
  `GET /fill-up-history/internal`, falling back to a local JSON cache in
  the ML container). This path is only reachable from two frontend debug
  routes (`app/ml-preview.tsx`, `app/debug/ml-account.tsx`), not the main
  app flow — see the security gap noted below.
- App preferences (color mode, high contrast, compact cards, reminders,
  budget alerts) persist per-user via AsyncStorage, keyed by Firebase UID
  so switching accounts on one device doesn't leak the previous account's
  settings.

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

## Merging `Christion` with `main` (2026-08-11)

The two branches had built overlapping features independently (finance
persistence, high contrast mode, settings screens, ML forecasting). Where
both sides solved the same problem, the more complete/integrated
implementation was kept rather than both:

- Finance inputs: `main`'s server-persisted, per-user, debounced-cloud-sync
  version replaced `Christion`'s AsyncStorage-only version.
- App preferences: `main`'s per-user-keyed version (adds `remindersEnabled`,
  `budgetAlertsEnabled`, used by the Home and Daily Rhythm screens) replaced
  `Christion`'s single-global-key version.
- Settings screens (`accessibility`, `account`, `notifications` — the last
  renamed `DailyRhythmSettings`): `main`'s versions kept, since they were
  already integrated with the richer AppPreferences shape.
- High contrast color values: `Christion`'s pure-black/white extremes kept
  (both sides had independently built a high-contrast palette; this was an
  aesthetic tie-break, not a correctness issue).
- `apps/frontend/lib/local-storage.ts` (the AsyncStorage helper the
  now-replaced `Christion` versions used) was deleted as dead code.
- Migration ID collision: both branches used `003` for their next
  migration. Renumbered `main`'s `finance_inputs` → `004` and
  `fill_up_history` → `005`; `Christion`'s `budget_entries` kept `003`.
  Neither had been applied to a shared database, so renumbering was safe.
- Found and fixed a real bug while verifying the merge in a fresh Docker
  build: `services/ml`'s `/ml-preview` self-bootstraps
  `budget_data.json` under `/workspace` on first request, but `appuser`
  didn't own that directory, so it crashed with `PermissionError` on any
  clean build (dev or production stage) — not something either branch's
  own testing had caught since a locally-built image can end up with the
  file already present from an earlier build. Fixed by chowning
  `/workspace` to `appuser`, matching the pattern already used in the
  backend/frontend Dockerfiles.
- `services/ml/budget_data.json`, `services/ml/app/user_history.json`, and
  a stray `data/user_history.json` were committed as generated runtime
  artifacts on `main`; removed from git and gitignored (the code
  self-bootstraps them; the ML README already documented this convention).

**Fixed 2026-08-12:** the backend's `GET /fill-up-history/internal` endpoint
(called by the ML service's `/ml-preview`) had no authentication and accepted
any `firebase_uid` as a query parameter — confirmed live on the deployed
Cloud Run backend (curling it with an arbitrary UID returned `200` with no
auth challenge). This had been noted as low-risk on the assumption it was
only reachable from two debug-only frontend routes and the Docker network,
but once the backend was deployed publicly that assumption no longer held —
the endpoint was reachable directly over the internet regardless of what the
frontend linked to. Fixed with a shared-secret header
(`INTERNAL_SERVICE_TOKEN`, checked via `requireInternalService` with a
timing-safe comparison) rather than `requireAuth`, since the caller is the
ML service, not an end user. Verified locally: no header → 401, wrong token
→ 401, correct token → 200.

## Capstone ends; Christion takes over the whole project (2026-08-13)

Presentation done, the team dissolved. Christion now owns backend, frontend,
and ML end to end; Parker occasionally contributes (mostly frontend); Gabe
and James are off the project. The "Team ownership" section at the top of
this file reflects the current state — earlier entries below that name
Gabriel or James as an area's owner describe what was true at the time, not
current fact.

Also around this time, Parker's ML rewrite replaced the `pandas`/
scikit-learn `LinearRegression` approach with a pure-Python recency-weighted
average of each entry's own cost-per-mile — `pandas` and `scikit-learn` are
no longer dependencies at all. The `method: "linear_regression"` field name
in the API response is kept for shape stability, not because it's still a
literal fitted regression.

## Full-project modularization and integrity pass (2026-08-19)

A large pass across all three services, at Christion's request, to check
project-wide correctness and split things up for maintainability. Highlights
(see git log on `main` for the full list of commits):

- **Backend**: extracted a shared route-param validation helper; deduped the
  vehicle PATCH handler.
- **ML service**: split the 432-line `app/main.py` monolith into
  `models.py`/`dataset.py`/`history.py`/`prediction.py`/`main.py`; confirmed
  (via a fresh venv install) that `pandas`/`scikit-learn` were genuinely
  unused and removed them from `requirements.txt`.
- **Frontend**: migrated the entire styling system from React Native
  `StyleSheet.create` to Tailwind CSS via NativeWind (`tailwind.config.js`,
  `components/ThemeVarsRoot.tsx` bridges the app's runtime dark/light/
  high-contrast theme into Tailwind as CSS variables). Extracted a set of
  shared UI primitives at `components/ui/` (`Card`, `CardTitle`, `CardText`,
  `StatusMessage`) plus several domain-specific shared components/hooks
  (`useStepFlow` + `StepFlowModal` for the app's several "one field at a
  time" wizards, `useMlPreview` for the two ML debug screens, shared auth
  and settings-screen components). Removed two components (`Header.tsx`,
  `SideMenu.tsx`) that had zero importers and predated the current
  navigation/theming system.
- Found and fixed a couple of real bugs along the way: `VehicleContext`'s
  `refreshVehicles` cleared `selectedVehicleId` before its fetch resolved,
  which silently defeated its own "keep the current selection" logic and
  reset a multi-vehicle user's selection on every screen focus;
  `debug/ml-account.tsx` read a `food_prediction` field the ML service's
  response no longer includes (`undefined.toFixed()` would have thrown).
- Every change in this pass was verified with the affected service's real
  checks (backend: typecheck/build/test; ML: pytest in both a fresh venv and
  the project's own; frontend: typecheck/lint/a full `expo export --platform
  web` build) rather than assumed safe from the diff alone.

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
