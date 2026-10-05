# Frontend

Expo SDK 57 / React Native app (web, Android, iOS) using Expo Router,
NativeWind (Tailwind) styling and Firebase Authentication. Code lives in
`apps/frontend/`; paths below are relative to it.

Before changing Expo code, read `apps/frontend/AGENTS.md`. It pins the Expo
docs version to follow and maps where everything lives: routes in `app/`,
providers in `contexts/`, shared UI in `components/`, and pure domain math
in `lib/`. Expo SDK upgrades must update that file too.

## Canonical Docker setup

From the repository root, copy `.env.example` to `.env`, fill in the
documented Firebase and API values, then run:

```powershell
docker compose --profile frontend up --watch --build
```

Compose passes the root `EXPO_PUBLIC_*` values into the frontend container.
These are public client configuration, not secrets, but `.env` still must
not be committed.

## Standalone setup

When working outside Docker, from `apps/frontend`:

```bash
cp .env.example .env
npm ci
npm start
```

Fill in the six `EXPO_PUBLIC_FIREBASE_*` variables and `EXPO_PUBLIC_API_URL`
(see the root README's "Front-End API Address by Platform" table). Google
sign-in also uses the optional web, iOS and Android OAuth client IDs; native
Google sign-in requires a development build rather than Expo Go.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npx expo install --check
npm run export:web
```

`npm test` runs the Jest suite (money-plan math, fuel projections, providers
and hooks). CI doesn't run it yet (see [KNOWN_ISSUES.md](KNOWN_ISSUES.md)), so
run it locally before pushing.

## Troubleshooting

**Stale typed-route errors.** Expo Router's typed-routes cache
(`.expo/types/router.d.ts`) is gitignored and only regenerates while
`expo start` is running. If a route file was moved, renamed or added, and
`npm run typecheck` reports errors on route paths that look correct, the
cache is stale. Run `npm run clean` (removes `.expo/` and `dist/`) and try
again.

**"Cannot find module" errors in VS Code that `tsc` doesn't report.** The
editor's TypeScript server is caching old paths (for example after files
move). Run **TypeScript: Restart TS Server** from the Command Palette, or
**Developer: Reload Window**.
