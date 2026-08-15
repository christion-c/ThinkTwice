# ThinkTwice ML Service

FastAPI service exposing:

- `GET /health` — liveness check.
- `POST /predict` — forecasts next-period fuel cost from a user's logged
  budget entries. This is the supported, backend-mediated path (see
  below).
- `GET /ml-preview`, `POST /fill-up-history` — an earlier, self-contained
  prototype that blends a math-based fuel forecast (fit on synthetic
  `budget_data.json` sample data) with a per-user fill-up history. History
  is read from the backend's `/fill-up-history/internal` endpoint first
  (authenticated with a shared `X-Internal-Token` header — see
  `INTERNAL_SERVICE_TOKEN` below), falling back to a local JSON cache
  (`ML_HISTORY_PATH`, defaults to `/home/appuser/.cache/thinktwice/user_history.json`)
  if the backend is unreachable. Used by the frontend's internal debug
  routes (`apps/frontend/app/ml-preview.tsx`,
  `apps/frontend/app/debug/ml-account.tsx`), not the main app flow.

## Module layout

- `app/main.py` — FastAPI app setup and route registration only; the
  actual logic lives in the modules below it imports from.
- `app/models.py` — Pydantic request/response shapes for `/predict`.
- `app/dataset.py` — the synthetic reference dataset `/ml-preview` uses
  as its math baseline.
- `app/history.py` — per-user fill-up history storage: durable via the
  backend, with a local-file fallback (see the caveat below).
- `app/prediction.py` — the prediction math for both `/predict` and
  `/ml-preview`.

## `POST /predict` contract

Request body:

```json
{
  "entries": [
    { "date": "2026-08-01", "fuelCost": 60, "foodCost": 20, "milesDriven": 150, "meals": 14 }
  ]
}
```

Every entry field except `date` is optional. Costs and mileage must be
non-negative; `meals` must be a non-negative integer. `foodCost`/`meals`
are accepted for forward-compatibility, but the current model only
forecasts fuel — see the response shape below.

Response body:

```json
{
  "predictedFuelCost": 64.2,
  "predictedFoodCost": 0.0,
  "predictedTotal": 64.2,
  "method": "linear_regression",
  "sampleSize": 5
}
```

`predictedFoodCost` is currently always `0.0` — the model was narrowed to
fuel-only cost-per-mile forecasting; food cost forecasting isn't
implemented despite the field still being present in the response shape
for API-shape stability.

With fewer than 3 entries, `method` is `"average"` — there isn't enough
data for a trend estimate, so the forecast is a plain average of logged
fuel costs instead. With 3 or more entries, `method` is
`"linear_regression"`: each entry's own cost-per-mile
(`fuel_cost / miles_driven`) is computed, then combined via a
recency-weighted average (see `prediction.py`'s
`recency_weighted_average` — the second-most-recent entry is weighted
most heavily, not the single most recent one, so a one-off spike doesn't
dominate the estimate) and scaled by the user's average recent mileage.
Despite the `"linear_regression"` label (kept for API-shape stability),
this is not scikit-learn's `LinearRegression` — the service has no
`pandas`/`scikit-learn` dependency at all.

The backend is the only caller — see `apps/backend/src/modules/predictions`.
It fetches the user's recent `budget_entries` rows and forwards them here;
the frontend never calls this service directly.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `BACKEND_URL` | Base URL for the backend, used to fetch durable fill-up history. Defaults to the Docker Compose service name (`http://backend:3000`). |
| `INTERNAL_SERVICE_TOKEN` | Shared secret sent as `X-Internal-Token` on requests to the backend's internal-only routes. Must match the value the backend expects (same env var name there) — see `apps/backend/src/middleware/require-internal-service.ts`. |
| `ML_HISTORY_PATH` | Local fallback-cache file path for fill-up history when the backend call fails. Not durable on Cloud Run (ephemeral, possibly multi-instance filesystem) — see `history.py`'s module docstring. |
| `PORT` | Read directly by the Dockerfile's `uvicorn` command (`${PORT:-8000}`), not by the app code — Cloud Run assigns this. |
