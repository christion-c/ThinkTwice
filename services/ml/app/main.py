"""ThinkTwice ML service: FastAPI app setup and route registration.

The actual logic lives in sibling modules so this file stays a short,
readable index of "what endpoints exist and what they call":

- models.py     Pydantic request/response shapes
- dataset.py    synthetic reference dataset for /ml-preview's baseline
- history.py    per-user fill-up history storage (backend-durable, with
                 a local-file fallback)
- prediction.py the actual prediction math for both /predict and
                 /ml-preview
"""

from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .history import load_user_history, save_user_history
from .models import PredictRequest, PredictResponse
from .prediction import (
    MIN_ENTRIES_FOR_REGRESSION,
    build_prediction,
    predict_by_average,
    predict_by_regression,
    recency_weighted_average,
)

app = FastAPI(title="ThinkTwice ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse, response_model_by_alias=True)
def predict(request: PredictRequest) -> PredictResponse:
    """Forecasts fuel/food cost from the user's own recently logged entries.

    This is the endpoint the real app uses (called server-to-server by
    the backend's /predictions route) — not to be confused with
    /ml-preview below, which is a separate debug-only flow.
    """
    if not request.entries:
        raise HTTPException(
            status_code=422,
            detail="At least one budget entry is required.",
        )

    if len(request.entries) < MIN_ENTRIES_FOR_REGRESSION:
        return predict_by_average(request.entries)

    return predict_by_regression(request.entries)


@app.post("/fill-up-history")
def fill_up_history(payload: dict[str, Any]) -> dict[str, Any]:
    """Backs the /ml-preview debug flow's own history writes (see history.py)."""
    return save_user_history(payload)


@app.get("/ml-preview")
def ml_preview(
    miles_driven: int = 120,
    user_id: str | None = None,
    fuel_price: float | None = None,
    combined_mpg: float | None = None,
    tank_capacity: float | None = None,
    gallons: float | None = None,
) -> dict[str, Any]:
    """Debug-only preview endpoint — not called by the main app.

    Backs the frontend's /ml-preview and /debug/ml-account screens, which
    call this directly from the browser (via EXPO_PUBLIC_ML_API_URL)
    rather than going through the backend.
    """
    return build_prediction(
        miles_driven=miles_driven,
        user_id=user_id,
        fuel_price=fuel_price,
        combined_mpg=combined_mpg,
        tank_capacity=tank_capacity,
        gallons=gallons,
    )


# Re-exported so existing imports (`from app.main import build_prediction,
# recency_weighted_average`, used by services/ml/tests/test_predict.py)
# keep working after this module split — these are read-only re-exports,
# not mutated anywhere, so a plain import binding is safe here. Contrast
# with HISTORY_PATH, which tests mutate directly and therefore import
# from app.history instead of via this re-export (see history.py's
# docstring and tests/test_main.py).
__all__ = [
    "app",
    "build_prediction",
    "load_user_history",
    "recency_weighted_average",
]
