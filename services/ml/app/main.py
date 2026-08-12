import json
import os
from datetime import date
from pathlib import Path
from typing import Any, Literal, Optional
import urllib.request
import urllib.parse
import urllib.error

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

app = FastAPI(title="ThinkTwice ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Below this many logged days, a fitted regression is unreliable (it can
# even be a perfect but meaningless fit through 2 points), so /predict
# falls back to a plain average instead of pretending to be precise.
MIN_ENTRIES_FOR_REGRESSION = 3


class BudgetEntry(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    date: date
    fuel_cost: Optional[float] = Field(default=None, alias="fuelCost", ge=0)
    food_cost: Optional[float] = Field(default=None, alias="foodCost", ge=0)
    miles_driven: Optional[float] = Field(
        default=None, alias="milesDriven", ge=0
    )
    meals: Optional[int] = Field(default=None, ge=0)


class PredictRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    entries: list[BudgetEntry]


class PredictResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    predicted_fuel_cost: float = Field(alias="predictedFuelCost")
    predicted_food_cost: float = Field(alias="predictedFoodCost")
    predicted_total: float = Field(alias="predictedTotal")
    method: Literal["average", "linear_regression"]
    sample_size: int = Field(alias="sampleSize")


APP_DIR = Path(__file__).resolve().parent
ROOT = APP_DIR.parent
DATA_PATH = ROOT / "budget_data.json"
DEFAULT_HISTORY_PATH = Path(
    os.getenv("ML_HISTORY_PATH",
              "/home/appuser/.cache/thinktwice/user_history.json")
)


def resolve_history_path() -> Path:
    history_path = DEFAULT_HISTORY_PATH
    try:
        history_path.parent.mkdir(parents=True, exist_ok=True)
        history_path.touch(exist_ok=True)
        history_path.write_text(
            "{}", encoding="utf-8") if not history_path.exists() else None
        return history_path
    except OSError:
        fallback_path = Path("/tmp/user_history.json")
        fallback_path.parent.mkdir(parents=True, exist_ok=True)
        fallback_path.touch(exist_ok=True)
        return fallback_path


HISTORY_PATH = resolve_history_path()


def build_dataset() -> list[dict[str, Any]]:
    if DATA_PATH.exists():
        with DATA_PATH.open("r", encoding="utf-8") as handle:
            try:
                payload = json.load(handle)
                if isinstance(payload, list):
                    return payload
            except json.JSONDecodeError:
                pass

    rows: list[dict[str, Any]] = []
    for index in range(1, 31):
        miles_driven = 90 + (index % 7) * 15 + (index % 3) * 5
        meals = 8 + (index % 5) * 2
        fuel_cost = round(1.8 + (miles_driven / 28) *
                          0.95 + (index % 4) * 0.35, 2)
        food_cost = round(4.4 + meals * 1.1 + (index % 3) * 0.5, 2)
        rows.append(
            {
                "date": f"2026-01-{index:02d}",
                "fuel_cost": fuel_cost,
                "food_cost": food_cost,
                "miles_driven": miles_driven,
                "meals": meals,
            }
        )

    DATA_PATH.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    return rows


BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:3000").rstrip("/")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "")


def load_user_history(user_id: str | None = None) -> list[dict[str, Any]]:
    # Try the backend first so history is durable across container restarts.
    if user_id:
        try:
            encoded = urllib.parse.quote(user_id, safe="")
            url = f"{BACKEND_URL}/fill-up-history/internal?firebase_uid={encoded}"
            request = urllib.request.Request(
                url, headers={"X-Internal-Token": INTERNAL_SERVICE_TOKEN}
            )
            with urllib.request.urlopen(request, timeout=3) as resp:  # noqa: S310
                payload = json.loads(resp.read().decode("utf-8"))
            entries = payload.get("entries", [])
            if isinstance(entries, list):
                return [
                    {
                        "miles_driven": e.get("milesDriven", 0),
                        "fuel_price": e.get("fuelPrice", 0),
                        "combined_mpg": e.get("combinedMpg", 0),
                        "tank_capacity": e.get("tankCapacity", 0),
                        "gallons": e.get("gallons", 0),
                        "observed_cost": e.get("observedCost", 0),
                    }
                    for e in entries
                    if isinstance(e, dict)
                ]
        except Exception:  # noqa: BLE001
            pass  # Fall through to the local file cache below.

    if not HISTORY_PATH.exists():
        return []

    try:
        payload = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []

    if not isinstance(payload, dict):
        return []

    if user_id is None:
        entries: list[dict[str, Any]] = []
        for value in payload.values():
            if isinstance(value, list):
                entries.extend(
                    [item for item in value if isinstance(item, dict)])
        return entries

    value = payload.get(user_id)
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]

    return []


def build_prediction(
    miles_driven: int = 120,
    user_id: str | None = None,
    fuel_price: float | None = None,
    combined_mpg: float | None = None,
    tank_capacity: float | None = None,
    gallons: float | None = None,
) -> dict[str, Any]:
    # Imported lazily so a request that never reaches this path (health
    # checks, /predict below the regression threshold) never pays the
    # pandas/scikit-learn import cost.
    import pandas as pd
    from sklearn.linear_model import LinearRegression

    rows = build_dataset()
    frame = pd.DataFrame(rows)

    features = frame[["miles_driven"]]
    fuel_target = frame["fuel_cost"]

    fuel_model = LinearRegression()
    fuel_model.fit(features, fuel_target)

    next_week = {"miles_driven": miles_driven}
    math_fuel_pred = round(
        float(fuel_model.predict([[next_week["miles_driven"]]])[0]), 2)

    history = load_user_history(user_id=user_id)
    history_count = len(history)
    fuel_prediction = math_fuel_pred
    blended = False
    blend_weight = 0.0

    if history_count > 0:
        history_rows = []
        for entry in history:
            history_rows.append(
                {
                    "miles_driven": entry.get("miles_driven", miles_driven),
                    "observed_cost": entry.get("observed_cost", math_fuel_pred),
                    "fuel_price": entry.get("fuel_price", fuel_price or 0),
                    "combined_mpg": entry.get("combined_mpg", combined_mpg or 0),
                    "tank_capacity": entry.get("tank_capacity", tank_capacity or 0),
                    "gallons": entry.get("gallons", gallons or 0),
                }
            )

        history_frame = pd.DataFrame(history_rows)
        if len(history_frame) > 0 and "observed_cost" in history_frame.columns:
            observed_costs = [
                float(value)
                for value in history_frame["observed_cost"].tolist()
                if isinstance(value, (int, float))
            ]
            robust_history_cost = robust_recent_average(observed_costs)

            if robust_history_cost is not None:
                # Increase personalization as history grows, but never let
                # history dominate the model completely.
                blend_weight = min(
                    0.55, 0.15 + (0.04 * min(history_count, 10)))
                fuel_prediction = round(
                    (math_fuel_pred * (1 - blend_weight))
                    + (robust_history_cost * blend_weight),
                    2,
                )
                blended = True

    total_prediction = round(fuel_prediction, 2)
    explanation_parts = [
        f"The preview starts with a math-based forecast from {len(rows)} sample rows using miles-driven as the main signal.",
        f"For {miles_driven} miles, the base regression estimate is ${math_fuel_pred:.2f} for fuel.",
    ]

    if blended:
        explanation_parts.append(
            f"Because this account already has {history_count} saved fill-up entry{'y' if history_count == 1 else 'ies'} in history, the preview blends the math estimate with a robust recency-weighted history trend.",
        )
        explanation_parts.append(
            f"The blend currently uses {round((1 - blend_weight) * 100)}% math baseline and {round(blend_weight * 100)}% history, while down-weighting outliers so one unusual stop does not swing the forecast.",
        )
    else:
        explanation_parts.append(
            "This account does not yet have enough history, so the preview is still using the math-only baseline.",
        )

    feedback = (
        f"Using the current miles-driven input, the fuel preview is ${fuel_prediction:.2f}."
    )
    if blended:
        feedback = (
            f"Using your recent fill-up history ({history_count} entry{'s' if history_count != 1 else ''}), the fuel preview is ${fuel_prediction:.2f}."
        )

    return {
        "rows": len(rows),
        "history_count": history_count,
        "next_week": next_week,
        "fuel_prediction": fuel_prediction,
        "total_prediction": total_prediction,
        "sample_rows": rows[:5],
        "feedback": feedback,
        "explanation": " ".join(explanation_parts),
    }


def robust_recent_average(values: list[float]) -> float | None:
    finite_values = [value for value in values if value > 0]
    if len(finite_values) == 0:
        return None

    recent_values = finite_values[:30]
    sorted_values = sorted(recent_values)
    median = sorted_values[len(sorted_values) // 2]

    deviations = [abs(value - median) for value in sorted_values]
    mad = sorted(deviations)[len(deviations) // 2] if deviations else 0.0

    if mad > 0:
        stable_values = [
            value for value in recent_values if abs(value - median) <= (3 * mad)
        ]
        if len(stable_values) == 0:
            stable_values = recent_values
    else:
        stable_values = recent_values

    weighted_sum = 0.0
    total_weight = 0.0
    for index, value in enumerate(stable_values):
        weight = pow(2.718281828, -(index / 6))
        weighted_sum += value * weight
        total_weight += weight

    return (weighted_sum / total_weight) if total_weight > 0 else None


def save_user_history(payload: dict[str, Any]) -> dict[str, Any]:
    user_id = payload.get("user_id")
    if not isinstance(user_id, str) or not user_id.strip():
        return {"ok": False, "error": "missing user_id"}

    existing_payload: dict[str, Any] = {}
    if HISTORY_PATH.exists():
        try:
            parsed = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
            if isinstance(parsed, dict):
                existing_payload = parsed
        except json.JSONDecodeError:
            existing_payload = {}

    try:
        HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
        HISTORY_PATH.touch(exist_ok=True)
    except OSError:
        pass

    entries = existing_payload.get(user_id, [])
    if not isinstance(entries, list):
        entries = []

    entry = {key: value for key, value in payload.items() if key != "user_id"}
    entries.append(entry)
    existing_payload[user_id] = entries
    try:
        HISTORY_PATH.write_text(json.dumps(
            existing_payload, indent=2), encoding="utf-8")
    except OSError as exc:
        return {"ok": False, "error": f"history_write_failed: {exc}"}
    return {"ok": True, "saved": len(entries)}


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok"}


def _average(values: list[Optional[float]]) -> float:
    if not values:
        return 0.0

    return sum(value or 0 for value in values) / len(values)


def _predict_by_average(entries: list[BudgetEntry]) -> PredictResponse:
    average_fuel = _average([entry.fuel_cost for entry in entries])
    average_food = _average([entry.food_cost for entry in entries])

    return PredictResponse(
        predicted_fuel_cost=round(average_fuel, 2),
        predicted_food_cost=round(average_food, 2),
        predicted_total=round(average_fuel + average_food, 2),
        method="average",
        sample_size=len(entries),
    )


def _predict_by_regression(entries: list[BudgetEntry]) -> PredictResponse:
    # Imported lazily: pandas/scikit-learn are only needed on this path, so
    # a request with too little data to regress never pays their import cost.
    import pandas as pd
    from sklearn.linear_model import LinearRegression

    frame = pd.DataFrame(
        [
            {
                "miles_driven": entry.miles_driven or 0,
                "meals": entry.meals or 0,
                "fuel_cost": entry.fuel_cost or 0,
                "food_cost": entry.food_cost or 0,
            }
            for entry in entries
        ]
    )

    features = frame[["miles_driven", "meals"]]

    fuel_model = LinearRegression().fit(features, frame["fuel_cost"])
    food_model = LinearRegression().fit(features, frame["food_cost"])

    # There's no known "next period" input, so the recent average driving
    # and eating pattern stands in for it.
    next_period = pd.DataFrame(
        [
            {
                "miles_driven": features["miles_driven"].mean(),
                "meals": features["meals"].mean(),
            }
        ]
    )

    predicted_fuel = max(float(fuel_model.predict(next_period)[0]), 0)
    predicted_food = max(float(food_model.predict(next_period)[0]), 0)

    return PredictResponse(
        predicted_fuel_cost=round(predicted_fuel, 2),
        predicted_food_cost=round(predicted_food, 2),
        predicted_total=round(predicted_fuel + predicted_food, 2),
        method="linear_regression",
        sample_size=len(entries),
    )


@app.post("/predict", response_model=PredictResponse, response_model_by_alias=True)
def predict(request: PredictRequest) -> PredictResponse:
    if not request.entries:
        raise HTTPException(
            status_code=422,
            detail="At least one budget entry is required.",
        )

    if len(request.entries) < MIN_ENTRIES_FOR_REGRESSION:
        return _predict_by_average(request.entries)

    return _predict_by_regression(request.entries)


@app.post("/fill-up-history")
def fill_up_history(payload: dict[str, Any]) -> dict[str, Any]:
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
    return build_prediction(
        miles_driven=miles_driven,
        user_id=user_id,
        fuel_price=fuel_price,
        combined_mpg=combined_mpg,
        tank_capacity=tank_capacity,
        gallons=gallons,
    )
