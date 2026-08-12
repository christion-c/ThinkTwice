# Shared Packages

Code or schemas intentionally shared across services live here. Changes can affect multiple owners — coordinate shared API types, generated clients, and validation schemas with the front-end, back-end, and ML owners before editing.

## `shared-types`

Type-only API contract shapes shared between `apps/backend` and `apps/frontend` (`UserProfile`, `Vehicle`, `BudgetEntry`, `FinanceInputs`, `BudgetPrediction`, etc.) — the single source of truth for what JSON crosses the HTTP boundary between them, so the two apps can't quietly drift out of sync on a shape.

- **Type-only, no runtime code.** Both apps import it with `import type`, which TypeScript fully erases at compile time — no npm dependency, no runtime footprint, nothing ships in either production image.
- **Written as `index.d.ts`, not `index.ts`.** Declaration files are exempt from `rootDir` enforcement, which is what makes plain `tsconfig.json` `paths` aliases work here without TypeScript project references or a build step for this package.
- **Consumed via a `paths` alias** (`@thinktwice/shared-types`) in each app's `tsconfig.json`, not via `npm install` — there's nothing to install.
- **Not consumed by `services/ml`** — Python can't read a TypeScript declaration file. The ML service's Pydantic models (`services/ml/app/main.py`) are a separate, parallel definition of the same prediction shape; if you change one, change the other too.
- **The backend's Docker build context is the repo root**, not `apps/backend`, specifically so `packages/shared-types` is reachable during `npm run build`'s `tsc` step. See the comment at the top of `infra/docker/backend/Dockerfile`. The frontend doesn't need this — Expo's Metro bundler doesn't run `tsc`, so it never needs to resolve the alias at build time.

If you add a field to a shared shape, update the interface in `shared-types/index.d.ts` first, then update whichever side(s) produce or consume it.
