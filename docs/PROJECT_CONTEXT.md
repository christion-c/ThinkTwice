# ThinkTwice Project Context

Last audited: 2026-10-10

Dated status and project history. Open bugs and to-dos live in the ThinkTwice
Issue Tracker (linked from [KNOWN_ISSUES.md](KNOWN_ISSUES.md)); deploy steps in
[deploying.md](deploying.md).

## Team ownership

Current ownership is defined in the root [AGENTS.md](../AGENTS.md):
Christion Callahan owns the whole project, and Parker Lewis occasionally
contributes. Historical entries below that name Gabriel Phipps or James
Lewis as owners of an area describe what was true at the time.

## Stack

- Expo SDK 57 / React Native frontend, styled with Tailwind CSS via
  NativeWind (see the 2026-08-19 entry below) rather than StyleSheet.create
- Node 22 / Express / TypeScript backend
- PostgreSQL 17
- Firebase Authentication
- Python 3.12 / FastAPI ML service - pure-Python recency-weighted average
  forecasting (see the 2026-08-13 entry below); no longer uses pandas or
  scikit-learn despite what earlier entries in this log describe
- Docker Compose development environment
- Production: backend and ML on Cloud Run, PostgreSQL on Cloud SQL, frontend
  web export on Firebase Hosting (`thinktwice.site`)

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
  `components/layout/ThemeVarsRoot.tsx` bridges the app's runtime dark/light/
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

## Money plan, frontend reorganization, and paychecks (2026-10-02 to 2026-10-05)

- **Money plan (2026-10-02):** the Finance tab became a month-by-month money
  plan (pay profile, bills, debts, assets) backed by migration `008`
  (`pay_profiles`, `money_items`) and `/money-plan` routes. `finance_inputs`
  still backs the Fuel tab's planner (fuel price, MPG, tank, miles); its
  income/expense columns are still stored but no screen edits them any more.
- **Expo SDK 57 (2026-10-02):** patch-aligned Expo packages; removed the
  unused `expo-modules-core` dependency and the obsolete `newArchEnabled`
  setting.
- **Frontend reorganization (2026-10-03):** providers moved to `contexts/`;
  `FinanceProvider`/`useFinance` renamed `FuelProvider`/`useFuel` (it holds
  fuel data; the Finance tab uses `MoneyPlanProvider`); `lib/` grouped into
  `api/`, `fuel/`, `money/`, `budget/`. The map lives in
  `apps/frontend/AGENTS.md`.
- **Fixes (2026-10-03):** removed Profile's duplicate settings button; made
  the display name editable (Firebase `updateProfile` plus a token refresh so
  the backend's synced copy updates); added paycheck logging (migration
  `009`, `/money-plan/paychecks`), where logged checks replace estimates for
  their month; and fixed projected net worth, which counted debt paydown but
  ignored each month's left over or shortfall.
- **Deploy incident (2026-10-05):** deploying the backend's `:latest` tag
  started a revision on a stale image without `/money-plan`, breaking the
  live Finance tab until it was redeployed by digest. Deploys are now done by
  digest with a 401-vs-404 route check (see [deploying.md](deploying.md)).
- **Docs consolidated (2026-10-05):** per-service READMEs moved into
  `docs/` (`backend.md`, `frontend.md`, `ml-service.md`, `shared-types.md`,
  `ci.md`); deploy steps combined into `deploying.md`. The "known
  incomplete" list that used to be in this file moved to `KNOWN_ISSUES.md`,
  dropping entries that were no longer true: account deletion is
  implemented, and the old notification-settings screen was replaced by
  local daily check-in reminders. Moving `.github/README.md` out also means
  GitHub now shows the root README on the repo home page.
- **CI green again (2026-10-05):** every CI run had been red, with three
  jobs failing. Backend and ML failed on formatting alone: Prettier
  `format:check` (20 files) and `ruff format --check` (one signature in
  `app/main.py`), both reformatted with no code changes. Frontend failed
  typecheck because `expo-env.d.ts`, which loads Expo's types (including the
  `*.css` declaration `app/_layout.tsx` relies on), is generated by
  `expo start` and gitignored, so it never exists in CI. `tsconfig.json` now
  lists `expo/types` itself. `npm test` was also added to the Frontend job
  so the Jest suite runs on every push.

## Accuracy audit fixes (2026-10-10)

An audit of the math, logic, copy and docs, then fixes for what it found.

- **Fuel forecast:** an unknown MPG no longer turns into the 5 MPG floor
  (that multiplied the fuel budget about 6x); a blank tank level is unknown
  rather than empty; "Next fill-up" counts down between check-ins using
  miles driven since the last one; fill-ups less than a day apart no longer
  count as a cycle; the Fuel screen's averages, MPG and lists now match the
  chart beside them and the selected vehicle.
- **Backend:** fill-up validation limits now match their NUMERIC columns
  (oversized values were a 500); `firebase-admin` updated within 14.x plus
  a non-breaking `npm audit fix`, leaving 0 backend audit findings.
- **ML service:** recency weights decay geometrically past the third entry
  (a long history used to outweigh recent entries); `/predict` falls back to
  the plain average when no entry has miles instead of returning $0; the
  local fallback history reads newest-first; the synthetic `/ml-preview`
  baseline no longer adds $20-$30.50 to each day's fuel cost, and its
  explanation says it's synthetic.
- **Money plan:** migration `010` adds `growth_percent` (an asset's yearly
  change, compounded monthly; negative for depreciation) and
  `balance_after_payment` (a debt's "Already paid this month" switch).
  Debt-to-income now counts paycheck-deducted debts. A new preference keeps
  left-over money out of projected net worth for people who spend it.
  Paychecks can be back-filled by typed date, and `app/paychecks.tsx` lists
  every logged check. Decided: paydays already past but never logged still
  count at the normal take-home, since forgetting to log is likelier than
  not being paid.
- **Other:** the ML debug pages render in development builds only; service
  folders have short READMEs again; `finance.tsx`'s helpers moved to
  `components/money/` and `lib/money/debt-status.ts`.
- **Frontend dependencies:** Expo patches aligned (`expo` 57.0.27,
  `expo-router` 57.0.25, `expo-auth-session` 57.0.14, `expo-notifications`
  57.0.22), then a non-breaking `npm audit fix`: 86 findings (1 critical,
  `shell-quote`) down to 79 (none critical). Running the audit fix before
  aligning Expo broke the web export (`Cannot read properties of undefined
  (reading 'OS')` exporting `/finance`); in that order it works.
- **Deploy order matters for this one:** the frontend now sends
  `growthPercent` and `balanceAfterPayment`, which the old backend's strict
  schemas reject, so deploy the backend (which applies migration `010` on
  startup) before the frontend.

## Google sign-in fix and 1.1.0 prep (2026-10-10)

- Google sign-in was disabled everywhere: no client IDs were configured,
  and web wrongly required one although Firebase's popup flow needs none.
  Web now always offers it. Native moved from `expo-auth-session` (removed;
  it relies on custom-scheme redirects Google restricts for Android OAuth
  clients) to `@react-native-google-signin/google-signin`, which Expo's
  guide recommends. Cancelling no longer leaves the button stuck on
  "Connecting Google...", the "G" mark now matches Google's, and signing out
  also clears the native Google session.
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` is no longer used and was removed
  from the env examples and `compose.yaml`; release builds now require
  `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- App version bumped to 1.1.0 for the closed test; notes in
  [RELEASE_NOTES.md](RELEASE_NOTES.md).
- Console setup done the same day: Google provider enabled in Firebase Auth,
  `thinktwice.site` added to authorized domains,
  `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` set in EAS (production and preview),
  and both SHA-1s (EAS upload key, Play app-signing key) added to the
  Firebase Android app. The 1.1.0 production build, installed from Play's
  internal-testing track, passed a full check: Google sign-in, cancel, sign
  out, Finance, Fuel and Settings.

## Known issues move to a tracker (2026-10-10)

- The 32 open items in `KNOWN_ISSUES.md` moved to the ThinkTwice Issue
  Tracker (a claude.ai page with its own database: status, priority, area,
  files). `KNOWN_ISSUES.md` now just links to it and keeps the standing
  notes. Before the move the file was reorganized (bugs by severity, the
  sync plan under "Repo and process") and made Prettier-stable after an
  editor's format-on-save had flattened its nested lists.

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
  `requirements.txt`) were removed on 2026-08-11; their logic became the real
  `/predict` implementation (then in `app/main.py`, now `app/prediction.py`).
- `apps/frontend/components/SimpleCardPage.tsx` was removed on 2026-08-11 after
  its last three callers (the accessibility, notifications, and account
  settings screens) became real functional screens instead of placeholders.
- CI now runs backend (`npm test` against a Postgres service container) and ML
  (`pytest`) test suites, not just typecheck/build/lint.
