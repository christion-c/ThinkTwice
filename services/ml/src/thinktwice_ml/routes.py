"""HTTP endpoints."""

from dataclasses import asdict
from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends

from thinktwice_ml.forecasting import Expense, forecast_month
from thinktwice_ml.schemas import (
    CategoryForecastOut,
    ForecastRequest,
    ForecastResponse,
    HealthResponse,
)
from thinktwice_ml.security import service_token_guard

if TYPE_CHECKING:
    from pydantic import SecretStr


def build_router(service_token: SecretStr) -> APIRouter:
    """Builds the service's routes; everything except /health requires the service token."""
    router = APIRouter()
    protected = APIRouter(dependencies=[Depends(service_token_guard(service_token))])

    @router.get("/health")
    async def health() -> HealthResponse:
        """Reports that the service is running."""
        return HealthResponse(status="ok")

    @protected.post("/forecasts")
    async def create_forecasts(body: ForecastRequest) -> ForecastResponse:
        """Forecasts the month-end total of each category the user has enough expenses in."""
        expenses = [
            Expense(
                category=expense.category,
                category_type=expense.category_type,
                amount_cents=expense.amount_cents,
                spent_on=expense.spent_on,
            )
            for expense in body.expenses
        ]
        forecasts = forecast_month(expenses, body.today)
        return ForecastResponse(
            month=body.today.strftime("%Y-%m"),
            forecasts=[CategoryForecastOut(**asdict(forecast)) for forecast in forecasts],
        )

    router.include_router(protected)
    return router
