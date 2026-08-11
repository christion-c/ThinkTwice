from datetime import date
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field

app = FastAPI(title="ThinkTwice ML Service")

# Below this many logged days, a fitted regression is unreliable (it can
# even be a perfect but meaningless fit through 2 points), so the service
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


@app.get("/health")
def health():
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
