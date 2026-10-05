# ThinkTwice Known Issues and To-Do

Last reviewed: 2026-10-05.

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
      (new `010`, since applied migrations can't be edited), the
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

## Money plan accuracy (Finance tab)

- [ ] **Can't log a paycheck older than 3 weeks.** The payday picker in
      `components/money/PaycheckSheet.tsx` only offers the last 21 days. Add a
      date picker, or more chips, so older checks can be back-filled.

- [ ] **Unlogged paydays are always estimated, even in past months.** If a
      biweekly month had 3 paydays and only 2 were logged, the third still
      counts at the normal take-home (`payForMonth` in `lib/money/plan.ts`).
      Decide whether paydays already past should count as $0 unless logged.

- [ ] **No paycheck history view.** Logged checks only show under the selected
      month on the Finance tab. Consider a full list, like `app/history.tsx`
      does for fill-ups.

- [ ] **Debt balances assume this month's payment hasn't been made.** The form
      says "Before this month's payment". If someone enters a balance after
      already paying, the schedule takes that payment out again, so future
      months show one payment less owed than is real. Consider asking
      "Already paid this month?" when entering a debt.

- [ ] **Assets never change value.** Savings, investments and cars stay at
      their entered value in every future month: no interest, growth or
      depreciation.

- [ ] **Projected net worth assumes all left-over money is kept.** Future
      months add each month's left over (or subtract the shortfall) as cash.
      The card labels this, but there's no way to say "I spend whatever's left".

- [ ] **Debt-to-income leaves out paycheck-deducted debts.** Debts marked
      "Taken from paycheck" (like a 401K loan) aren't counted in the DTI
      percentages; lenders usually count them. Decide whether to include
      them or keep the note that's shown now.

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

- [ ] **ML deploy steps don't name the image.** [deploying.md](deploying.md)
      only gives a command to look up the ML service's image path. Run it once
      (`gcloud run services describe thinktwice-ml --region us-east4 --format="value(spec.template.spec.containers[0].image)"`)
      and put the real path in the doc.

- [ ] **Parker's branch is out of date.** `parker` is 97 commits behind `main`
      and still has the old file layout from before the 2026-10-03
      reorganization. Update it from `main` before new work goes on it.

- [ ] **Agent rules don't require frontend tests.** The "Required
      verification" list in the root `AGENTS.md` doesn't include `npm test`
      for the frontend, although CI now runs it. Add it.

- [ ] **Service folders have no README.** `apps/backend/`, `apps/frontend/`,
      `services/ml/` and `packages/` lost theirs when the docs moved to
      `docs/`. Add short READMEs there that point to the matching doc, for
      anyone browsing those folders on GitHub.

## Security and dependencies

- [ ] **Frontend has 80 npm audit findings (66 high, 14 moderate).** They come
      through Expo, React Native, Jest, NativeWind/Tailwind and Firebase
      (e.g. `node-forge`, `@xmldom/xmldom`, `@grpc/grpc-js`, `braces`). Every
      offered fix is a major-version bump, so don't run
      `npm audit fix --force`. Most will clear with future Expo SDK upgrades.
      Upgrading the SDK means updating `apps/frontend/AGENTS.md` too.

- [ ] **Backend has 11 npm audit findings (3 high, 8 moderate),** all through
      `firebase-admin`. A non-breaking fix exists within 14.x: run
      `npm update firebase-admin` in `apps/backend`, then run the full backend
      checks.

- [ ] **Internal debug pages are open to any signed-in user.** `/ml-preview`
      and `/debug/ml-account` aren't linked anywhere, but anyone who knows the
      URL can open them. They only show that user's own data, so the risk is
      low. Hide them in production builds or restrict them to your account.

## Code health

- [ ] **`app/finance.tsx` is ~550 lines.** `ItemRow`, `IconButton` and
      `debtStatus` are defined inside the screen file. Move them to
      `components/money/` to match the repo rule that `app/` holds routes only.

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
