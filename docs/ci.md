# CI

`.github/workflows/validate.yml` runs on every push and pull request. It has
four independent jobs:

| Job | Working directory | Checks |
| --- | --- | --- |
| Backend | `apps/backend` | `npm ci`, lint, `format:check` (Prettier), typecheck, build, `npm test` against a Postgres 17 service container |
| Frontend | `apps/frontend` | `npm ci`, lint, typecheck, `npm test` (Jest), `expo install --check`, static web export |
| ML service | `services/ml` | install, `pip check`, `pip-audit`, `ruff check`, `ruff format --check`, an import check that `/health` is registered, `pytest` |
| Docker build | repo root | builds the backend and ML production images (build only, no push), so a broken Dockerfile fails CI instead of surfacing at deploy time |

No job deploys anything. Deploys are run by hand; see
[deploying.md](deploying.md).
