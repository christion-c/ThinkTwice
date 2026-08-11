# ThinkTwice Front End

This Expo SDK 54 / React Native app uses Expo Router and Firebase Authentication.

## Canonical Docker setup

From the repository root, copy `.env.example` to `.env`, configure the documented Firebase and API values, then run:

```powershell
docker compose --profile frontend up --watch --build
```

Compose passes the root `EXPO_PUBLIC_*` values into the front-end container. These values are public client configuration, not secrets, but `.env` still must not be committed.

## Standalone setup

When working outside Docker:

```bash
cp .env.example .env
npm ci
npm start
```

Fill in the six `EXPO_PUBLIC_FIREBASE_*` variables. Google sign-in also uses the optional web, iOS, and Android OAuth client IDs; native Google sign-in requires a development build rather than Expo Go.

## Validation

```bash
npm run lint
npm run typecheck
npx expo install --check
npm run export:web
```

Files inside `app/` are routes and layouts. Put reusable providers, themes, navigation, and presentational components in `components/` so Expo Router does not register them as screens.

## Troubleshooting: stale typed-route errors

Expo Router's typed routes cache (`.expo/types/router.d.ts`) is gitignored and only regenerates while `expo start` is running. If a route file was moved, renamed, or added and `npm run typecheck` reports errors on route paths that look correct, the cache is stale rather than the code being wrong. Run `npm run clean` (removes `.expo/` and `dist/`) and try again.
