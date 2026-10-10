# ThinkTwice Known Issues and To-Do

Last reviewed: 2026-10-10.

Check items off as they're done, and add new ones under the right heading. When
an item is finished, delete it here and, if it's worth remembering, record it
in [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

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

- [ ] **Google sign-in and native builds haven't been tested end to end.**
      Google sign-in needs provider configuration and a development build;
      nobody has tested Android or iOS builds against real Firebase.

- [ ] **No text-size setting for accessibility.** There's only high-contrast
      mode, and screens set fixed font sizes.

- [ ] **"Miles logged" on Profile only covers the last 60 check-ins,** because
      the backend returns at most 60 daily logs. Add a backend total if
      lifetime miles matter.

## Repo and process

- [ ] **Parker's branch is out of date.** `parker` hasn't changed since
      2026-08-12. It was 98 commits behind `main` on 2026-10-10, before the
      audit-fix commits, and still has the old file layout from before the
      2026-10-03 reorganization. Update it from `main` before new work goes
      on it.

## Security and dependencies

- [ ] **Frontend has 79 npm audit findings (58 high, 21 moderate)** as of
      2026-10-10, after the non-breaking `npm audit fix`. They come through
      Expo, React Native, Jest, NativeWind/Tailwind and Firebase (e.g.
      `node-forge`, `@xmldom/xmldom`, `@grpc/grpc-js`). `npm audit fix` has
      nothing left it can apply; the remaining fixes need major-version
      bumps, directly or further up the chain, so don't run
      `npm audit fix --force`. Most
      will clear with future Expo SDK upgrades. Upgrading the SDK means
      updating `apps/frontend/AGENTS.md` too. Align Expo's patch versions
      (`npx expo install --check`) before any `npm audit fix`: running it on
      mixed Expo patches broke the web export.

## Code health

- [ ] **One backend comment points at an old path.**
      `apps/backend/src/db/migrations/006-create-daily-driving-logs.ts`
      mentions `apps/frontend/lib/finance-projections.ts`, which is now
      `lib/fuel/projections.ts`. Leave it: applied migrations must not be
      edited.

## Environment notes

- The devcontainer has no `gcloud` or `gh` CLI. Deploys, Secret Manager
  access and PR creation happen from the Windows laptop (see
  [deploying.md](deploying.md) and
  [christion-laptop-setup.md](christion-laptop-setup.md)).

- Local ADC has to be set up on each machine as an impersonated credential
  for `thinktwice-dev-backend`, never a downloaded key (root README, step 4).

- Docker inside the devcontainer publishes ports on the host, not on
  `localhost`. To reach a container from inside the devcontainer, use its
  bridge IP (`docker inspect`) or `host.docker.internal`.
