"""Tests for the month-end pace forecast."""

from datetime import date

from thinktwice_ml.forecasting import (
    MIN_EXPENSES_FOR_FORECAST,
    CategoryType,
    Expense,
    forecast_month,
    project_month_total,
)


def coffee(
    amount_cents: int, spent_on: date, category_type: CategoryType = "discretionary"
) -> Expense:
    """Builds a coffee expense."""
    return Expense(
        category="Coffee",
        category_type=category_type,
        amount_cents=amount_cents,
        spent_on=spent_on,
    )


def test_projects_the_mvp_example() -> None:
    """$35 of coffee in the first 7 days of a 31-day month is about $155 by the month's end."""
    assert project_month_total(3_500, date(2026, 10, 7)) == 15_500


def test_projection_rounds_to_the_nearest_cent() -> None:
    """100 cents over 3 days of a 31-day month projects to 1033.33 cents, rounded to 1033."""
    assert project_month_total(100, date(2026, 10, 3)) == 1_033


def test_projection_uses_the_real_length_of_the_month() -> None:
    """February in a leap year has 29 days."""
    assert project_month_total(1_000, date(2028, 2, 10)) == 2_900


def test_on_the_last_day_the_projection_equals_spending_so_far() -> None:
    """With no days left, nothing more is projected."""
    assert project_month_total(12_345, date(2026, 10, 31)) == 12_345


def test_forecasts_a_category_with_enough_expenses() -> None:
    """A category with the minimum number of expenses gets a forecast."""
    expenses = [coffee(500, date(2026, 10, day)) for day in (1, 3, 5, 7, 7, 7, 7)]
    [forecast] = forecast_month(expenses, date(2026, 10, 7))
    assert forecast.category == "Coffee"
    assert forecast.expense_count == 7
    assert forecast.spent_so_far_cents == 3_500
    assert forecast.projected_month_cents == 15_500


def test_skips_categories_without_enough_expenses() -> None:
    """Too few expenses would make a misleading forecast, so none is given."""
    expenses = [coffee(500, date(2026, 10, 2))] * (MIN_EXPENSES_FOR_FORECAST - 1)
    assert forecast_month(expenses, date(2026, 10, 7)) == []


def test_ignores_expenses_outside_this_month_so_far() -> None:
    """Last month's and future-dated expenses don't count toward this month's pace."""
    expenses = [
        coffee(500, date(2026, 9, 30)),
        coffee(500, date(2026, 10, 8)),
        *[coffee(100, date(2026, 10, 1))] * 3,
    ]
    [forecast] = forecast_month(expenses, date(2026, 10, 7))
    assert forecast.expense_count == 3
    assert forecast.spent_so_far_cents == 300


def test_keeps_categories_with_the_same_name_but_different_types_apart() -> None:
    """Categories are identified by name and type together."""
    expenses = [
        *[coffee(100, date(2026, 10, 1))] * 3,
        *[coffee(200, date(2026, 10, 1), "essential")] * 3,
    ]
    forecasts = forecast_month(expenses, date(2026, 10, 7))
    assert [(f.category_type, f.spent_so_far_cents) for f in forecasts] == [
        ("essential", 600),
        ("discretionary", 300),
    ]


def test_returns_the_biggest_projections_first() -> None:
    """The most expensive habit comes first."""
    groceries = [
        Expense(
            category="Groceries",
            category_type="essential",
            amount_cents=5_000,
            spent_on=date(2026, 10, 2),
        )
    ] * 3
    expenses = [*[coffee(500, date(2026, 10, 1))] * 3, *groceries]
    assert [f.category for f in forecast_month(expenses, date(2026, 10, 7))] == [
        "Groceries",
        "Coffee",
    ]
