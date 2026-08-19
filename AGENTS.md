# ThinkTwice Repository Rules

## Ownership

- Christion Callahan owns the whole project (`apps/backend/`, `apps/frontend/`,
  `services/ml/`, and everything shared) — the capstone team dissolved after
  presentation (Aug 2026); this is no longer a per-folder split between
  separate owners.
- Parker Lewis occasionally contributes, most often to `apps/frontend/`.
- Gabriel Phipps and James Lewis are no longer on the project — don't route
  questions or coordination to them.
- Because one person now owns everything, there's no cross-owner coordination
  step required before touching `compose.yaml`, `.env.example`, `infra/`,
  database schemas, or API request/response contracts — just be deliberate,
  since those are still the files most likely to break something else if
  changed carelessly.
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
