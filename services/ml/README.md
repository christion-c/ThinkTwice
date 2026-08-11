# ThinkTwice ML Service

FastAPI service exposing:

- `GET /health` — liveness check.
- `POST /predict` — forecasts next-period fuel and food cost from a user's
  logged budget entries. This is the supported, backend-mediated path (see
  below).
- `GET /ml-preview`, `POST /fill-up-history` — an earlier, self-contained
  prototype that blends a math-based fuel forecast (fit on synthetic
  `budget_data.json` sample data) with a per-user fill-up history. History
  is read from the backend's `/fill-up-history/internal` endpoint first,
  falling back to a local JSON cache
  (`ML_HISTORY_PATH`, defaults to `/home/appuser/.cache/thinktwice/user_history.json`)
  if the backend is unreachable. Used by the frontend's internal debug
  routes (`apps/frontend/app/ml-preview.tsx`,
  `apps/frontend/app/debug/ml-account.tsx`), not the main app flow.

  **Known gap:** neither this endpoint nor the backend's
  `/fill-up-history/internal` endpoint it calls require authentication —
  `/fill-up-history/internal` accepts any `firebase_uid` as a query
  parameter and returns that user's fill-up history. Fine for now since
  these are debug-only routes not linked from primary navigation, but
  worth locking down before this becomes user-facing.

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
non-negative; `meals` must be a non-negative integer.

Response body:

```json
{
  "predictedFuelCost": 64.2,
  "predictedFoodCost": 24.8,
  "predictedTotal": 89.0,
  "method": "linear_regression",
  "sampleSize": 5
}
```

With fewer than 3 entries, `method` is `"average"` — there isn't enough
data to fit a meaningful regression, so the forecast is a plain average of
the logged costs instead. With 3 or more entries, `method` is
`"linear_regression"`: a `LinearRegression` fit per cost type on
`[miles_driven, meals]`, evaluated at the user's recent average driving and
eating pattern (there's no known "next period" input, so the recent
average stands in for it).

The backend is the only caller — see `apps/backend/src/modules/predictions`.
It fetches the user's recent `budget_entries` rows and forwards them here;
the frontend never calls this service directly.

Gabriel Phipps owns this area. Coordinate any change to the `/predict`
request/response shape with the back-end owner, since `apps/backend`
depends on it directly.
