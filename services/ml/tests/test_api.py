"""Tests for the HTTP endpoints, including that only the API can call them."""

from typing import TYPE_CHECKING, Any

import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from thinktwice_ml.config import Settings
from thinktwice_ml.main import create_app
from thinktwice_ml.schemas import MAX_EXPENSES_PER_REQUEST

if TYPE_CHECKING:
    from collections.abc import Iterator

SERVICE_TOKEN = "test-service-token-0123456789abcdef"  # noqa: S105 - test-only value
AUTH = {"Authorization": f"Bearer {SERVICE_TOKEN}"}
EXPENSE = {
    "category": "Coffee",
    "category_type": "discretionary",
    "amount_cents": 500,
    "spent_on": "2026-10-01",
}


@pytest.fixture
def client() -> Iterator[TestClient]:
    """Provides a test client for an app configured with a known service token."""
    settings = Settings(ml_service_token=SecretStr(SERVICE_TOKEN))
    with TestClient(create_app(settings)) as test_client:
        yield test_client


def forecast_body(**overrides: Any) -> dict[str, Any]:  # noqa: ANN401 - JSON values are untyped
    """Builds a valid /forecasts request body, with fields overridden."""
    return {"today": "2026-10-07", "expenses": [EXPENSE] * 3, **overrides}


def test_health_is_public(client: TestClient) -> None:
    """Health checks need no token."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_returns_forecasts(client: TestClient) -> None:
    """A valid request gets each category's projection."""
    response = client.post("/forecasts", json=forecast_body(), headers=AUTH)
    assert response.status_code == 200
    assert response.json() == {
        "month": "2026-10",
        "forecasts": [
            {
                "category": "Coffee",
                "category_type": "discretionary",
                "expense_count": 3,
                "spent_so_far_cents": 1_500,
                "projected_month_cents": 6_643,
            },
        ],
    }


@pytest.mark.parametrize(
    "headers",
    [
        {},
        {"Authorization": "Bearer wrong-token"},
        {"Authorization": f"Bearer {SERVICE_TOKEN}x"},
        {"Authorization": f"Basic {SERVICE_TOKEN}"},
        {"Authorization": SERVICE_TOKEN},
    ],
    ids=["no header", "wrong token", "token with extra character", "wrong scheme", "no scheme"],
)
def test_rejects_requests_without_the_service_token(
    client: TestClient, headers: dict[str, str]
) -> None:
    """Only the ThinkTwice API, which knows the token, may ask for forecasts."""
    response = client.post("/forecasts", json=forecast_body(), headers=headers)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_checks_the_token_before_the_body(client: TestClient) -> None:
    """Callers without the token learn nothing about what a valid body looks like."""
    response = client.post("/forecasts", json={"nonsense": True})
    assert response.status_code == 401


@pytest.mark.parametrize(
    "body",
    [
        forecast_body(user_id="someone"),
        forecast_body(expenses=[{**EXPENSE, "note": "private note"}]),
        forecast_body(expenses=[{**EXPENSE, "amount_cents": "500"}]),
        forecast_body(expenses=[{**EXPENSE, "amount_cents": 0}]),
        forecast_body(expenses=[{**EXPENSE, "amount_cents": 10_000_001}]),
        forecast_body(expenses=[{**EXPENSE, "category": ""}]),
        forecast_body(expenses=[{**EXPENSE, "category": "x" * 41}]),
        forecast_body(expenses=[{**EXPENSE, "category_type": "fun"}]),
        forecast_body(expenses=[{**EXPENSE, "spent_on": "2026-02-30"}]),
        forecast_body(today="not a date"),
        forecast_body(expenses=[EXPENSE] * (MAX_EXPENSES_PER_REQUEST + 1)),
    ],
    ids=[
        "unknown field",
        "expense with a note",
        "amount as a string",
        "zero amount",
        "amount over the limit",
        "empty category",
        "category name too long",
        "unknown category type",
        "impossible date",
        "invalid today",
        "too many expenses",
    ],
)
def test_rejects_invalid_requests(client: TestClient, body: dict[str, Any]) -> None:
    """Every field is validated and nothing unexpected is accepted."""
    response = client.post("/forecasts", json=body, headers=AUTH)
    assert response.status_code == 422


@pytest.mark.parametrize("path", ["/docs", "/redoc", "/openapi.json"])
def test_publishes_no_documentation(client: TestClient, path: str) -> None:
    """The internal service gives callers no map of its endpoints."""
    assert client.get(path).status_code == 404


def test_refuses_to_start_with_a_short_service_token() -> None:
    """A guessable token is a configuration error, caught at startup."""
    with pytest.raises(ValueError, match="at least 32 items"):
        Settings(ml_service_token=SecretStr("too-short"))
