# ThinkTwice Release Notes

Newest first. Each version has the full notes for testers, then a short
"What's new" text to paste into Play Console (it allows 500 characters).

## 1.1.0 (closed test)

### What's new

**Sign in with Google**

- Google sign-in now works in the Android app, using Google's own sign-in
  screen. Closing that screen no longer leaves the button stuck on
  "Connecting Google...".
- Signing out also signs out of Google, so the next sign-in lets you pick an
  account.

**Fuel**

- The monthly fuel budget no longer balloons when the app doesn't know your
  car's MPG yet.
- "Next fill-up in X days" now counts down between check-ins, using the
  miles you drive.
- If you haven't entered a tank level, the gauge shows "—" instead of an
  empty tank.
- Fill-ups logged a few hours apart no longer throw off your miles-per-day.
- The fill-up chart, its averages, and the recent fill-ups list now match
  each other and only show the vehicle you've picked. MPG there is measured
  from your miles and gallons.

**Finance**

- **Already paid this month:** when adding a debt, say whether this month's
  payment is already out of the balance, so it isn't counted twice.
- **Assets can grow or lose value:** give savings an interest rate, or a car
  a yearly loss in value, and future months show it.
- **Keep left-over money (Settings):** turn it off if you usually spend
  what's left, and future net worth stops counting it as savings.
- **Debt-to-income** now includes debts taken from your paycheck, like a
  401K loan.
- **Older paychecks:** log a check from more than 3 weeks ago by typing its
  date, and see every logged check on the new Paychecks screen ("All
  paychecks" on the Finance tab).

**Fixes**

- Clearer wording in a few places, including the Home screen's take-home
  line, which now mentions fuel.

### Known limits for testers

- If you're testing on both the web and an older app version, use the new
  app version to edit debts: an older version turns "Already paid this
  month" back off when it saves that debt.
- Google sign-in on iPhone isn't part of this test.

### Play Console "What's new" (paste-ready)

```text
- Sign in with Google now works in the app
- Fuel: more accurate monthly budget, a countdown to your next fill-up, and stats for the vehicle you pick
- Debts: mark this month's payment as already paid
- Assets: add yearly growth or loss in value
- Settings: choose whether left-over money counts as savings
- Paychecks: log older checks and see them all in one list
- Debt-to-income now includes paycheck deductions
```
