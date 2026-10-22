"""Request and response bodies. Unknown fields are rejected and every value is size-limited."""

from datetime import date
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StrictInt

from thinktwice_ml.forecasting import CategoryType

# Matches the limits in packages/shared and the database.
MAX_AMOUNT_CENTS = 10_000_000
MAX_CATEGORY_NAME_LENGTH = 40
# A month of expenses for even a very active user is far below this.
MAX_EXPENSES_PER_REQUEST = 5_000


class _StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class ExpenseIn(_StrictModel):
    """One expense sent by the API: no IDs, emails or notes, only what forecasting needs."""

    category: Annotated[str, Field(min_length=1, max_length=MAX_CATEGORY_NAME_LENGTH)]
    category_type: CategoryType
    amount_cents: Annotated[StrictInt, Field(gt=0, le=MAX_AMOUNT_CENTS)]
    spent_on: date


class ForecastRequest(_StrictModel):
    """A user's recent expenses and their local date."""

    today: date
    expenses: Annotated[list[ExpenseIn], Field(max_length=MAX_EXPENSES_PER_REQUEST)]


class CategoryForecastOut(_StrictModel):
    """Where one category's spending is heading by the end of the month."""

    category: str
    category_type: CategoryType
    expense_count: int
    spent_so_far_cents: int
    projected_month_cents: int


class ForecastResponse(_StrictModel):
    """Month-end forecasts for every category with enough data, biggest first."""

    month: str
    forecasts: list[CategoryForecastOut]


class HealthResponse(_StrictModel):
    """Reports that the service is running."""

    status: str
