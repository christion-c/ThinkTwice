# ThinkTwice Known Issues and To-Do

Last reviewed: 2026-10-10 | 4:37am

Add new items under the right heading, most important first. When an item is
done, delete it here (don't just check it off) and, if it's worth remembering,
record it in [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md). Re-check dated facts
(counts, versions, commit numbers) before relying on them.

## Bugs

- [ ] **"Delete my account" deletes the data but not the login.** Settings →
      Account → Delete my account shows "Your data was deleted, but removing
      your login failed." `DELETE /users/me` (`users.routes.ts`) deletes the
      Postgres user first, which works, then calls Firebase Admin's
      `deleteUser`, which fails. Likely cause: the Cloud Run service account
      lacks the **Firebase Authentication Admin** role
      (`roles/firebaseauth.admin`). Verifying sign-in tokens needs no IAM
      role, so this is the backend's first call that does. Confirm with
      `gcloud run services logs read thinktwice-backend --region us-east4 --limit 200 | Select-String "failed to delete the Firebase account" -Context 0,12`,
      then grant the role to the service account the backend runs as and
      retry. Google Play requires in-app account deletion, so fix this before
      the closed test grows. The data part already works and is safe to
      retry.

- [ ] **A deleted account can come straight back.** `requireAuth` calls
      `verifyIdToken` without `checkRevoked`, so an ID token stays valid for
      up to an hour after its Firebase user is deleted, and
      `syncCurrentUser` upserts a profile row on every authenticated
      request. Any request still in flight after deletion (a screen
      refetching on focus) recreates an empty profile for the deleted user.
      After deletion, the app should sign out before anything else can
      fetch, and the backend should refuse tokens for deleted users (check
      `auth_time`/revocation for that route, or skip the upsert when
      Firebase reports the user gone).

- [ ] **The privacy policy and delete-account page don't list everything the
      app stores.** `app/privacy-policy.tsx` ("Information we collect") and
      `app/delete-account.tsx` ("What gets deleted") cover account info,
      budget and vehicle data and fill-ups, but not the money plan (hourly
      rate, hours, take-home, logged paychecks, bills, debt balances and
      APRs, assets) or daily mileage check-ins. Google Play's data-safety
      form has to match what the app collects, and debts and pay count as
      financial info there. The delete-account page also calls in-app
      deletion "instant", which it isn't while the login-deletion bug above
      is open. Update both pages and their "last updated" date, then the
      Play data-safety form. If "clear all data" (under Requested app
      changes) ships first, describe it on the delete-account page too.

- [ ] **The live site is behind the Play app.** Play has 1.1.0 (`404e330`),
      but thinktwice.site still serves the earlier `audit-fixes` build
      (`entry-66cfc2c7…`, checked 2026-10-10), so Google sign-in is disabled
      on the web while it works on Android. Redeploy the site from `main`
      (`npm ci`, then the frontend steps in [deploying.md](deploying.md)).
      The item under "Repo and process" keeps it from happening again.

## Requested app changes

- [ ] **Add a "Use phone setting" appearance option.** Preferences only offers
      Dark and Light today: `ColorMode` in `lib/theme.ts` is `"dark" | "light"`,
      and the saved preference defaults to `"dark"`
      (`contexts/AppPreferencesProvider.tsx`). Add a third choice that follows
      the phone's light/dark setting (React Native's `useColorScheme()`), and
      make it the default. `app.json` already sets `userInterfaceStyle` to
      `"automatic"`, so the app can read the phone's setting. Users who already
      picked Dark or Light should keep their choice. The Profile screen's
      "Appearance" row needs a label for the new option.

- [ ] **Let users clear all their data without deleting the account.** A
      second option next to "Delete my account" in Settings → Account:
      wipe everything (vehicles, fill-ups, check-ins, budget entries, fuel
      planner inputs, pay profile, bills, debts, assets, paychecks) but keep
      the login and profile. Needs a backend route (e.g.
      `DELETE /users/me/data`) that deletes from every table referencing
      `users` in one transaction, plus a test that reads `information_schema`
      so a future table can't be missed. The app should also clear its
      on-device caches (the fuel inputs cache in AsyncStorage) and refetch.
      Decide whether app preferences (theme, reminders) count as data to
      clear. The public `delete-account` page should then describe both
      options; do that with the privacy-policy fix under Bugs if possible.

- [ ] **The bottom nav bar doesn't really float.** It's styled as a rounded
      island, but it sits on a solid strip that runs across the screen, so it
      looks like an island on a banner. Cause: `PageScaffold` lays the nav
      out _below_ the scroll view instead of over it, and the outer wrapper
      in `components/layout/BottomNav.tsx` has an opaque `bg-background` and
      padding, so content stops at that strip rather than scrolling behind
      the island. To float it: position the nav absolutely over the content
      (bottom-anchored, respecting the safe-area inset), make the wrapper
      transparent, and add bottom padding to the scroll content equal to the
      bar's height so the last card isn't hidden. Check both themes, compact
      cards, the wide-layout `max-w-[560px]` wrapper, and the keyboard
      (the bar shouldn't ride up over inputs).

- [ ] **Bills need a due date.** Bills only have a name and monthly amount;
      there's nowhere to say when one is due. This needs a database migration
      (new `011`, since applied migrations can't be edited), the
      `/money-plan/items` route schema, the shared `MoneyItem` type, and a
      field in `components/money/MoneyItemSheet.tsx`. A day of the month
      (1-31) is probably enough. Decide what happens in shorter months, such as
      a bill due on the 31st in February.

- [ ] **Bill due-date reminders.** Let users get a notification before a bill
      is due and choose how many days in advance. This needs bill due dates
      first (item above). The daily check-in reminder already schedules local
      notifications (`lib/checkin-reminders.ts`, `hooks/useCheckinReminders.ts`)
      and can serve as the pattern. The setting belongs in Preferences, next
      to the existing reminder toggle. Reminders have to be rescheduled
      whenever a bill is added, edited or deleted.

- [ ] **Quick actions are hard to reach.** They're the last card on the Home
      screen (`app/index.tsx`), so users have to scroll to the bottom. Move them
      near the top, or make them always visible, for example as a row under
      the header or a floating button.

## New features

- [ ] **Fall theme.** Colors are defined as dark and light palettes in
      `lib/theme.ts`, with high-contrast overrides, then passed to Tailwind as
      CSS variables by `components/layout/ThemeVarsRoot.tsx`. A seasonal theme
      means new palettes plus a theme picker in Preferences. Decide whether
      each season gets its own light and dark version, and how it combines
      with high contrast.

- [ ] **Winter theme.** Same approach as the fall theme; building both
      together means the theme picker only has to be built once.

- [ ] **Move Profile off the bottom bar, give its spot to Nutrition.** Make
      Profile and Settings reachable from the Home screen instead (for
      example, an avatar or gear button in the Home header), and put Nutrition
      in the bottom-bar slot Profile uses now (`components/layout/nav-tabs.ts`).
      Nutrition is still paused (see "Nutrition is paused" below), so the tab
      needs that feature finished first, or it will open the placeholder page.

## Features to finish

- [ ] **Nutrition is paused.** The tab is commented out in
      `components/layout/nav-tabs.ts` and on the Home screen (`app/index.tsx`).
      `app/nutrition.tsx` is a placeholder, and `contexts/BudgetProvider.tsx`
      and `lib/budget/` are kept but unused. Either finish it or delete all of
      them together.

- [ ] **Sign-up doesn't ask for a name.** New accounts have no display name
      until someone sets one in Settings → Account. Add an optional name field
      to `app/auth/register.tsx`.

- [ ] **iOS has never been built.** Google sign-in on iOS also needs an
      iOS OAuth client ID (`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, which turns on
      the iOS URL-scheme plugin in `app.config.ts`); see
      [frontend.md](frontend.md#google-sign-in).

- [ ] **No text-size setting for accessibility.** There's only high-contrast
      mode, and screens set fixed font sizes.

- [ ] **"Miles logged" on Profile only covers the last 60 check-ins,** because
      the backend returns at most 60 daily logs. Add a backend total if
      lifetime miles matter.

## Repo and process

- [ ] **Parker's branch is out of date.** `parker` hasn't changed since
      2026-08-12 and still has the old file layout from before the
      2026-10-03 reorganization; it was 123 commits behind `main` on
      2026-10-10. Update it from `main` before new work goes on it.

- [ ] **Nothing checks that web and Android ship the same code.** They ship
      separately and by hand (EAS build for Android, `expo export` + Firebase
      deploy for web), so one can fall behind silently (see "The live site
      is behind the Play app" under Bugs). Add:

  1. **Build stamp:** embed the app version and git commit in both
     builds through `app.config.ts` `extra` (EAS provides the commit on
     its build workers; the web export can read `git rev-parse`), and
     show it in Settings, e.g. "Version 1.1.0 (404e330)", so anyone can
     compare the two at a glance.
  2. **Published version file:** write `dist/version.json` (version +
     commit) during the web export, so the live site can be checked
     with `curl`.
  3. **Automated check:** a GitHub Actions job (on a schedule, and after
     deploys) that compares the site's `version.json` commit with the
     latest production EAS build's commit (`eas build:list --json`,
     using an `EXPO_TOKEN` secret) and fails when they differ.
  4. **Release checklist:** a "Release" section in
     [deploying.md](deploying.md) that ships web and Android from the
     same commit, every time.
  5. **Same tests on both:** the code that's meant to differ by
     platform lives in `*.native.ts` files (today only
     `lib/google-sign-in`). Keep that list small, and give each such
     module tests for both versions. A later step could run the same
     end-to-end flows on web (Playwright) and Android (Maestro).

- [ ] **CI doesn't build the frontend Docker image.** The `Docker build` job
      in `.github/workflows/validate.yml` builds the backend and ML images
      only. The frontend image builds today (checked 2026-10-10, with
      `apps/frontend` as the context like `compose.yaml`), but a broken
      frontend Dockerfile would go unnoticed. Add it to that job.

## Security and dependencies

- [ ] **Frontend has 80 npm audit findings (59 high, 21 moderate)** as of
      2026-10-10, after the non-breaking `npm audit fix`. They come through
      Expo, React Native, Jest, NativeWind/Tailwind and Firebase (e.g.
      `node-forge`, `@xmldom/xmldom`, `@grpc/grpc-js`); the 80th is
      `@react-native-google-signin/google-signin`, flagged only because it
      depends on `expo`. `npm audit fix` has nothing left it can apply: the
      remaining fixes need major-version bumps, directly or further up the
      chain, so don't run `npm audit fix --force`. Most will clear with
      future Expo SDK upgrades (which also mean updating
      `apps/frontend/AGENTS.md`). Align Expo's patch versions
      (`npx expo install --check`) before any `npm audit fix`: running it on
      mixed Expo patches broke the web export.

- [ ] **`.claude/settings.local.json` is tracked in git.** Claude Code treats
      `settings.local.json` as per-person and untracked, and this one grants
      every tool to any agent (`"allow": ["*"]`) for anyone who clones the
      repo. Remove it from git (`git rm --cached`), add it to `.gitignore`,
      and keep shared, narrower permissions in `.claude/settings.json` if
      they're wanted.

## Production practices

- [ ] **Network calls have no timeout.** The app's `requestBackend`
      (`lib/api/backend.ts`) and the backend's calls to the ML service
      (`predictions.client.ts`) use `fetch` with no time limit, so a stalled
      connection leaves a spinner up (or a request open) until the platform
      gives up. Add an `AbortSignal.timeout(...)` to each, and show a
      "couldn't reach the server" message.

- [ ] **Rate limits are per instance.** `express-rate-limit` keeps counts in
      memory, so with several Cloud Run instances each one allows the full
      limit (300 per 15 minutes, 60 for `/auth`). Fine at this size; use a
      shared store (e.g. Redis) or Cloud Armor if real abuse protection is
      needed.

- [ ] **Every authenticated request writes to the database.**
      `syncCurrentUser` upserts the user row on each request, which also
      bumps `updated_at` every time (so it no longer means "profile
      changed"). Update only when a field actually differs
      (`... WHERE users.email IS DISTINCT FROM EXCLUDED.email OR ...`).

- [ ] **Some tables have no per-user cap.** Money items (200) and paychecks
      (1,000) are capped, but vehicles, fill-ups, daily check-ins and budget
      entries aren't, and `GET /fill-up-history` returns every row. Add caps
      in line with the others, and page or limit that list.

- [ ] **The fuel planner's inputs are stored as free text.**
      `finance.routes.ts` accepts any string up to 30 characters for every
      field ("abc" included); the app parses them later. Validate them as
      numbers (or blank) on the server, so bad values can't be saved from
      another client.

## Code health

- [ ] **`contexts/FuelProvider.tsx` is 652 lines.** It holds the fuel
      planner inputs, their local cache and debounced cloud sync, fill-up
      and check-in history actions, and the forecast. Split the input
      persistence and the history actions into hooks (like
      `usePersistedUserState`) so each part can be read and tested alone.

- [ ] **Out-of-date comments and values.**

  - `users.routes.ts` and `deleteCurrentUserAccount` in
    `lib/api/backend.ts` list what account deletion removes, but not
    the money plan (pay profile, bills, debts, assets, paychecks).
    The deletion itself does cover them, via `ON DELETE CASCADE`.
  - `.gitignore` says the ML data files are explained in
    `services/ml/app/main.py`; that's now `dataset.py` and `history.py`.
  - `GET /` on the backend reports `"version": "0.1.0"`, unrelated to the
    app's 1.1.0. Report the real build or commit (see the build stamp
    under "Repo and process") or drop it.

- [ ] **A few files have no comments at all.** `apps/backend/src/db/pool.ts`,
      `modules/health/health.routes.ts`, and the frontend's
      `app/auth/register.tsx` and `app/auth/forgot-password.tsx`. Every
      other source file explains itself; add a short header to each.

- [ ] **The backend docs have no route reference.** `docs/backend.md`
      describes the module layout but doesn't list the endpoints
      (`/money-plan/...`, `/users/me`, `/fill-up-history/internal`, etc.),
      what each needs (Firebase token vs internal token), or their status
      codes. Add a table.

## Notes

These aren't to-dos; they're facts worth knowing.

- `apps/backend/src/db/migrations/006-create-daily-driving-logs.ts`
  mentions `apps/frontend/lib/finance-projections.ts`, which is now
  `lib/fuel/projections.ts`. Leave it: applied migrations must not be
  edited.

- The devcontainer has no `gcloud` or `gh` CLI. Deploys, Secret Manager
  access and PR creation happen from the Windows laptop (see
  [deploying.md](deploying.md) and
  [christion-laptop-setup.md](christion-laptop-setup.md)).

- Local ADC has to be set up on each machine as an impersonated credential
  for `thinktwice-dev-backend`, never a downloaded key (root README, step 4).

- Docker inside the devcontainer publishes ports on the host, not on
  `localhost`. To reach a container from inside the devcontainer, use its
  bridge IP (`docker inspect`) or `host.docker.internal`.
