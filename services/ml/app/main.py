import json
import os
from pathlib import Path
from typing import Any
import urllib.request
import urllib.parse
import urllib.error

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sklearn.linear_model import LinearRegression

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


def load_user_history(user_id: str | None = None) -> list[dict[str, Any]]:
    # Try the backend first so history is durable across container restarts.
    if user_id:
        try:
            encoded = urllib.parse.quote(user_id, safe="")
            url = f"{BACKEND_URL}/fill-up-history/internal?firebase_uid={encoded}"
            with urllib.request.urlopen(url, timeout=3) as resp:  # noqa: S310
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
    rows = build_dataset()
    frame = pd.DataFrame(rows)

    features = frame[["miles_driven"]]
    fuel_target = frame["fuel_cost"]
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
            recent_average = float(history_frame["observed_cost"].mean())
            fuel_prediction = round(
                (math_fuel_pred * 0.7) + (recent_average * 0.3), 2)
            blended = True

    total_prediction = round(fuel_prediction, 2)
    explanation_parts = [
        f"The preview starts with a math-based forecast from {len(rows)} sample rows using miles-driven as the main signal.",
        f"For {miles_driven} miles, the base regression estimate is ${math_fuel_pred:.2f} for fuel.",
    ]

    if blended:
        explanation_parts.append(
            f"Because this account already has {history_count} saved fill-up entry{'y' if history_count == 1 else 'ies'} in history, the preview blends the math estimate with the recent observed cost.",
        )
        explanation_parts.append(
            "The blend uses 70% of the math estimate and 30% of the recent history average, so the result becomes more personalized over time.",
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
