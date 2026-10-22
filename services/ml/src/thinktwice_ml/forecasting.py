"""Month-end spending forecasts, as in "at this pace, that's about $140 this month".

v1 uses a simple, explainable pace calculation (see docs/mvp.md). Machine-learning models replace it
once there is enough real spending data to train them.
"""

import calendar
from collections import defaultdict
from dataclasses import dataclass
from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    from datetime import date

CategoryType = Literal["essential", "discretionary"]

# A category needs at least this many expenses this month before its forecast means anything.
MIN_EXPENSES_FOR_FORECAST = 3


@dataclass(frozen=True)
class Expense:
    """One expense, with only the fields forecasting needs."""

    category: str
    category_type: CategoryType
    amount_cents: int
    spent_on: date


@dataclass(frozen=True)
class CategoryForecast:
    """Where one category's spending is heading by the end of the month."""

    category: str
    category_type: CategoryType
    expense_count: int
    spent_so_far_cents: int
    projected_month_cents: int


def project_month_total(spent_so_far_cents: int, today: date) -> int:
    """Projects the month-end total in whole cents, assuming spending continues at the same pace."""
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    days_elapsed = today.day
    # Integer division rounded half up, so money never becomes a float.
    return (2 * spent_so_far_cents * days_in_month + days_elapsed) // (2 * days_elapsed)


def forecast_month(expenses: list[Expense], today: date) -> list[CategoryForecast]:
    """Forecasts each category's month-end total from this month's expenses, biggest first."""
    month_start = today.replace(day=1)
    groups: defaultdict[tuple[str, CategoryType], list[Expense]] = defaultdict(list)
    for expense in expenses:
        if month_start <= expense.spent_on <= today:
            groups[expense.category, expense.category_type].append(expense)

    forecasts = []
    for (category, category_type), category_expenses in groups.items():
        if len(category_expenses) < MIN_EXPENSES_FOR_FORECAST:
            continue
        spent_so_far_cents = sum(expense.amount_cents for expense in category_expenses)
        forecasts.append(
            CategoryForecast(
                category=category,
                category_type=category_type,
                expense_count=len(category_expenses),
                spent_so_far_cents=spent_so_far_cents,
                projected_month_cents=project_month_total(spent_so_far_cents, today),
            ),
        )
    return sorted(forecasts, key=lambda forecast: forecast.projected_month_cents, reverse=True)
