# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Where things live

- `app/` - routes and layouts only. File paths are URLs; don't move them to tidy up.
- `components/layout/` - app shell: `PageScaffold`, `BottomNav`, `nav-tabs`, `ThemeVarsRoot`.
- `components/ui/` - generic UI primitives (cards, charts, buttons, `StepFlowModal`).
- `components/<feature>/` - pieces used by one area (`auth`, `fuel`, `home`, `money`, `ml`, ...).
- `contexts/` - React providers and their `use*` hooks:
  - `FuelProvider` / `useFuel` - fill-ups, daily miles, fuel budget inputs and forecasts (Fuel, Home, History).
  - `MoneyPlanProvider` / `useMoneyPlan` - pay, bills and debts (Finance tab).
  - `VehicleProvider`, `AuthProvider`, `AppPreferencesProvider`; `BudgetProvider` is unmounted (paused nutrition feature).
- `hooks/` - screen-flow and utility hooks.
- `lib/api/` - backend/ML HTTP clients. `lib/fuel/`, `lib/money/`, `lib/budget/` - pure, unit-tested domain math.
- `lib/` root - small shared helpers (`theme`, `color`, `firebase`, `local-date`, ...).
