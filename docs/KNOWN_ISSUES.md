# ThinkTwice Known Issues and To-Do

Last reviewed: 2026-10-05 (after the paycheck/net-worth release, commit `a55d135`,
and the docs consolidation).

Check items off as they're done, and add new ones under the right heading. When
an item is finished, delete it here and, if it's worth remembering, record it
in [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

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
