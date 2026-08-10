# ThinkTwice Repository Rules

## Ownership

- Christion Callahan owns `apps/backend/` and backend/database integration.
- Parker Lewis owns `apps/frontend/`.
- Gabriel Phipps owns `services/ml/`.
- Coordinate changes to `compose.yaml`, `.env.example`, `infra/`, database schemas,
  and API request/response contracts with every affected owner.
- Read and follow the nearest nested `AGENTS.md`. Frontend work must follow the
  Expo SDK version pinned there.

## Security and credentials

- Never create, commit, print, or share `.env` files, ADC files, access tokens,
  refresh tokens, private keys, or service-account key JSON.
- Firebase Admin must use `applicationDefault()`.
- Local backend credentials must use Google ADC impersonating
  `thinktwice-dev-backend`; never use a downloaded service-account key.
- Docker may receive ADC only through `GOOGLE_ADC_PATH`, mounted read-only, with
  `GOOGLE_CLOUD_PROJECT` supplied separately.
- `EXPO_PUBLIC_*` values are client-visible configuration and must never contain
  secrets.

## Repository and Docker hygiene

- Protect every Docker build context with `.dockerignore`.
- Do not copy `.env`, `.expo`, `node_modules`, `dist`, credentials, or caches
  into Docker images.
- Keep `.env.example` secret-free and complete enough for Compose interpolation.
- Do not track generated Expo, Firebase Hosting, build, cache, or coverage output.
- Database migrations are append-only after application. Never reorder, rename,
  or edit an applied migration.

## Frontend routing

- Files under `apps/frontend/app/` are routes or layouts only.
- Put reusable components, contexts, helpers, and theme modules outside `app/`.
- Expo SDK upgrades require frontend-owner coordination and an update to
  `apps/frontend/AGENTS.md`.

## Required verification

Before handing off a change, run the checks relevant to the affected subsystem:

- Backend: clean install, typecheck, build, and migration/API integration checks.
- Frontend: clean install, lint, TypeScript, Expo dependency check, web export,
  and native checks when platform configuration changes.
- ML: dependency check, tests, API import, and endpoint/model contract checks.
- Shared Docker changes: Compose validation, Dockerfile checks, and image builds.
- Confirm `git status` contains no secrets, generated files, or unrelated changes.
