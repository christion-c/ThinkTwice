# ThinkTwice Project Context

Last audited: 2026-08-09

Audited base revision: `5274dc4` on `Christion`
Remote status at audit: local branch five commits ahead of `origin/Christion`

## Team ownership

- Backend: Christion Callahan
- Frontend: Parker Lewis and James Lewis
- Machine learning: Gabriel Phipps

## Stack

- Expo SDK 54 / React Native frontend
- Node 22 / Express / TypeScript backend
- PostgreSQL 17
- Firebase Authentication
- Python 3.12 / FastAPI ML service
- Docker Compose development environment

## Authentication model

- The frontend signs users in with Firebase Authentication.
- The backend verifies Firebase ID tokens with Firebase Admin.
- Firebase Admin uses `applicationDefault()`.
- Local development is intended to use ADC impersonating
  `thinktwice-dev-backend`.
- Service-account private-key JSON is prohibited.
- Docker mounts ADC read-only from `GOOGLE_ADC_PATH`.

## Verified working on 2026-08-09

- Backend clean TypeScript typecheck and build.
- PostgreSQL migrations `001_create_users` and `002_create_vehicles`.
- Backend root and database health endpoints.
- Authenticated routes reject missing tokens.
- Backend, frontend, and ML Docker images build.
- Frontend clean `npm ci`, lint, Expo SDK alignment, and web export.
- ML dependency audit, application import, and health endpoint after upgrading
  FastAPI from 0.110.0 to 0.141.1.

## Known incomplete or external work

- ML currently exposes health only; prediction code is not integrated.
- The Expo SDK 54 dependency tree retains 24 npm audit findings (13 high and 11
  moderate). Resolving the remaining Metro/Expo findings requires a coordinated
  major Expo upgrade; never run `npm audit fix --force` as an unattended fix.
- Firebase Admin retains six moderate transitive `uuid` findings. npm's proposed
  automated fix is a breaking downgrade of Firebase Admin and was not applied.
- Google OAuth requires provider configuration and a native development build.
- A valid Firebase-token flow and native Android/iOS builds were not exercised in
  the 2026-08-09 audit.
- Local ADC must be verified as an impersonated-service-account credential on
  each developer machine.

## History and operational notes

- The frontend lockfile was updated; a clean Node 22 `npm ci` succeeds.
- A nonbreaking lockfile-only npm remediation reduced the frontend audit from 28
  findings to 24 without changing Expo SDK 54.
- The frontend Dockerfile previously retained a recursive workspace `chown`; it
  was removed after the 2026-08-09 audit.
- VS Code forwarding previously occupied ports 5433 and 8000. Docker owns the
  published development ports, so automatic devcontainer forwarding is disabled.
- Finance and fuel calculations are currently client-side/manual.
- Vehicle profiles are persisted through the backend/PostgreSQL API.
- Backend-to-ML and ML-to-backend integration is not implemented yet.
