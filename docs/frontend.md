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
and hooks). CI runs every one of these checks on each push.

## Google sign-in

`lib/google-sign-in.ts` (web) and `lib/google-sign-in.native.ts` (Android,
iOS) share one API; Metro picks the file per platform.

- **Web** uses Firebase's `signInWithPopup` and needs no client ID: just the
  Google provider enabled in Firebase Auth, with `thinktwice.site` in its
  authorized domains.
- **Android and iOS** use `@react-native-google-signin/google-signin` (the
  native Google SDK, as Expo's guide recommends). It doesn't run in Expo Go;
  use a development or release build. It needs
  `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`: the *Web* OAuth client ID from
  Firebase Auth > Sign-in method > Google > Web SDK configuration. Release
  builds refuse to start building without it (`app.config.ts`).

One-time setup for Android:

1. In Firebase project settings, make sure there's an Android app for
   `com.thinktwicefinance.app`.
2. Add both signing keys' **SHA-1** fingerprints to that Android app:
   - the EAS upload key: `npx eas-cli credentials --platform android`
     (production profile; shows the SHA-1);
   - the Play **app signing** key: in Play Console, open the app's "App
     signing" page (search "App signing"; it's under App integrity).

   Without the Play key's SHA-1, a Play-installed build fails with
   `DEVELOPER_ERROR` (code `10`), which the app shows as "Google sign-in
   isn't set up for this version of the app yet."
3. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in the EAS environments the build
   profiles use (`npx eas-cli env:create`), and in `apps/frontend/.env` for
   development builds.

iOS also needs `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; `app.config.ts` adds the
Google Sign-In config plugin (which sets the iOS URL scheme) only when it's
set.

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
