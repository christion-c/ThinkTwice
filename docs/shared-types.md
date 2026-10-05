# Shared Packages

Code or schemas intentionally shared across services live in `packages/`. A
change there can affect the backend, frontend, and ML service at once, so
check all three before committing.

## `shared-types`

Type-only API contract shapes shared between `apps/backend` and `apps/frontend` (`UserProfile`, `Vehicle`, `BudgetEntry`, `FinanceInputs`, `BudgetPrediction`, `PayProfile`, `MoneyItem`, `Paycheck`, etc.) — the single source of truth for what JSON crosses the HTTP boundary between them, so the two apps can't quietly drift out of sync on a shape.

- **Type-only, no runtime code.** Both apps import it with `import type`, which TypeScript fully erases at compile time — no npm dependency, no runtime footprint, nothing ships in either production image.
- **Written as `index.d.ts`, not `index.ts`.** Declaration files are exempt from `rootDir` enforcement, which is what makes plain `tsconfig.json` `paths` aliases work here without TypeScript project references or a build step for this package.
- **Consumed via a `paths` alias** (`@thinktwice/shared-types`) in each app's `tsconfig.json`, not via `npm install` — there's nothing to install.
- **Not consumed by `services/ml`** — Python can't read a TypeScript declaration file. The ML service's Pydantic models (`services/ml/app/models.py`) are a separate, parallel definition of the same prediction shape; if you change one, change the other too.
- **The backend's Docker build context is the repo root**, not `apps/backend`, specifically so `packages/shared-types` is reachable during `npm run build`'s `tsc` step. See the comment at the top of `infra/docker/backend/Dockerfile`. The frontend doesn't need this — Expo's Metro bundler doesn't run `tsc`, so it never needs to resolve the alias at build time.

If you add a field to a shared shape, update the interface in `packages/shared-types/index.d.ts` first, then update whichever side(s) produce or consume it.

**Adoption on the backend is deliberately narrow.** Only `modules/predictions/predictions.client.ts` imports from here (`BudgetPrediction`/`PredictionResult`, the one shape that's genuinely identical everywhere). Every other backend module (`budget`, `vehicles`, `finance`, `money-plan`, `users`, ...) defines its own parallel type in its `*.repository.ts` file instead — same name as the matching `shared-types` export in some cases (e.g. `Vehicle`), but a different shape (real `Date` objects and internal-only fields like `userId`, versus the wire-format `string` timestamps `shared-types` describes). That's intentional, not a sign the package is half-adopted: repository types describe what's actually in the database, `shared-types` describes what crosses the HTTP boundary, and those aren't always the same shape. If you're skimming an import list and see `Vehicle` imported from two different places in the codebase, this is why.
