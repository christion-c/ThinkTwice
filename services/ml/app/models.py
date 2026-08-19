# Pydantic request/response shapes for the /predict endpoint.
# Kept separate from main.py so the API contract is easy to find in one
# place, and so prediction.py can import these without pulling in
# FastAPI app setup or routing.

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class BudgetEntry(BaseModel):
    # One logged day of spending, as sent by the backend's /predictions route.
    # populate_by_name=True lets this accept either the snake_case field
    # name or its camelCase alias, since the backend forwards the
    # frontend's camelCase JSON as-is rather than translating it first.
    model_config = ConfigDict(populate_by_name=True)

    date: date
    fuel_cost: Optional[float] = Field(default=None, alias="fuelCost", ge=0)
    food_cost: Optional[float] = Field(default=None, alias="foodCost", ge=0)
    miles_driven: Optional[float] = Field(
        default=None, alias="milesDriven", ge=0
    )
    meals: Optional[int] = Field(default=None, ge=0)


class PredictRequest(BaseModel):
    # Request body for POST /predict: the user's recent budget entries.
    model_config = ConfigDict(populate_by_name=True)

    entries: list[BudgetEntry]


class PredictResponse(BaseModel):
    # Response body for POST /predict.
    # response_model_by_alias=True on the route (see main.py) makes
    # FastAPI serialize this using the camelCase aliases below, matching
    # what the frontend/backend's shared-types package expects - see
    # packages/shared-types/index.d.ts's BudgetPrediction on the TS side,
    # which mirrors this shape field-for-field (kept in sync by hand,
    # since Python and TypeScript can't share a type definition directly).
    model_config = ConfigDict(populate_by_name=True)

    predicted_fuel_cost: float = Field(alias="predictedFuelCost")
    predicted_food_cost: float = Field(alias="predictedFoodCost")
    predicted_total: float = Field(alias="predictedTotal")
    method: Literal["average", "linear_regression"]
    sample_size: int = Field(alias="sampleSize")
