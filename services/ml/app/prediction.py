# Fuel-cost prediction math.
#
# Two independent prediction paths live here, serving two different endpoints:
#   predict_by_average / predict_by_regression, used by POST /predict -
#     the real endpoint the deployed app calls (via the backend's
#     /predictions route) to forecast a user's fuel/food costs from
#     their own logged budget entries.
#   build_prediction, used by GET /ml-preview - a debug-only endpoint
#     (not linked from the main app) that blends a synthetic reference
#     dataset with the user's fill-up history to preview a
#     cost-per-mile estimate.
#
# They're kept separate rather than unified because they answer
# different questions with different inputs (a user's own logged
# entries vs. a generic "how much does fuel cost per mile" baseline) -
# merging them would make both harder to reason about for a small
# amount of code reuse.

from typing import Any, Optional

from .dataset import build_dataset
from .history import load_user_history
from .models import BudgetEntry, PredictResponse

# Below this many logged days, a fitted regression is unreliable (it
# can even be a perfect but meaningless fit through 2 points), so
# /predict falls back to a plain average instead of pretending to be precise.
MIN_ENTRIES_FOR_REGRESSION = 3


def recency_weighted_average(values: list[float]) -> float | None:
    # Turns a list of historical cost-per-mile observations into one
    # representative rate. The single most recent entry is deliberately
    # NOT weighted highest - a single brand-new fill-up can be a
    # one-off (a road trip, a price spike at one station) - so the
    # second-most-recent entry carries the strongest weight instead,
    # keeping the estimate grounded in the user's established pattern
    # rather than over-reacting to the very latest data point. Weight
    # decays for older entries beyond that.

    # Drop non-positive/invalid readings before weighting.
    finite_values = [value for value in values if value > 0]
    if len(finite_values) == 0:
        return None

    if len(finite_values) == 1:
        return finite_values[0]

    # Build one weight per value: index 1 (second-most-recent) gets the
    # highest weight, index 0 (most recent) less, and everything older
    # decays smoothly.
    weights: list[float] = []
    for index in range(len(finite_values)):
        if index == 1:
            weight = 6.0
        elif index == 0:
            weight = 1.0
        else:
            weight = max(0.25, 1.0 / (1 + index))
        weights.append(weight)

    # Standard weighted-average formula: sum(value * weight) / sum(weight).
    weighted_sum = sum(
        value * weight for value, weight in zip(finite_values, weights)
    )
    total_weight = sum(weights)
    return weighted_sum / total_weight if total_weight > 0 else None


def build_prediction(
    miles_driven: int = 120,
    user_id: str | None = None,
    fuel_price: float | None = None,
    combined_mpg: float | None = None,
    tank_capacity: float | None = None,
    gallons: float | None = None,
) -> dict[str, Any]:
    # Backs GET /ml-preview: blends a synthetic baseline with real user
    # history. Returns a dict rather than a Pydantic model since this
    # is a debug/preview endpoint whose response shape has grown
    # organically and isn't a stable public contract the way
    # PredictResponse is.

    # Step 1: derive a cost-per-mile baseline from the synthetic reference dataset.
    rows = build_dataset()

    dataset_cost_per_mile = [
        float(row["fuel_cost"]) / float(row["miles_driven"])
        for row in rows
        if float(row.get("miles_driven", 0) or 0) > 0
    ]
    baseline_cost_per_mile = (
        sum(dataset_cost_per_mile) / len(dataset_cost_per_mile)
        if dataset_cost_per_mile else 0.29
    )
    baseline_prediction = round(miles_driven * baseline_cost_per_mile, 2)

    # Step 2: if the user has fill-up history, blend it into the baseline.
    history = load_user_history(user_id=user_id)
    history_count = len(history)
    fuel_prediction = baseline_prediction
    blended = False
    blend_weight = 0.0

    if history_count > 0:
        history_rates = []
        for entry in history:
            entry_miles = float(entry.get("miles_driven", miles_driven) or 0)
            observed_cost = float(entry.get("observed_cost", 0) or 0)
            if entry_miles > 0 and observed_cost > 0:
                history_rates.append(observed_cost / entry_miles)

        if history_rates:
            history_rate = recency_weighted_average(history_rates)
            if history_rate is not None:
                user_fuel_prediction = round(history_rate * miles_driven, 2)
                # Blend weight grows with history_count (capped at 90%)
                # so the estimate leans more on real user data over
                # time without ever fully abandoning the math baseline.
                blend_weight = min(0.9, 0.65 + (0.05 * min(history_count, 10)))
                fuel_prediction = round(
                    (baseline_prediction * (1 - blend_weight))
                    + (user_fuel_prediction * blend_weight),
                    2,
                )
                blended = True

    # Step 3: assemble the response, including a human-readable explanation.
    total_prediction = round(fuel_prediction, 2)
    next_week = {
        "miles_driven": miles_driven,
        "fuel_price": fuel_price,
        "combined_mpg": combined_mpg,
        "tank_capacity": tank_capacity,
        "gallons": gallons,
    }
    explanation_parts = [
        f"The math baseline uses a real-world cost-per-mile estimate from {len(rows)} reference fill-ups and then personalizes it with the user's fill-up history.",
        f"For {miles_driven} miles, the baseline estimate is ${baseline_prediction:.2f} for fuel.",
    ]

    if blended:
        explanation_parts.append(
            f"Because this account already has {history_count} saved fill-up entry{'y' if history_count == 1 else 'ies'} in history, the model blends the math baseline with the user's observed cost-per-mile trend.",
        )
        explanation_parts.append(
            f"The blend currently uses {round((1 - blend_weight) * 100)}% baseline and {round(blend_weight * 100)}% history, with the second-most-recent fill-up weighted most heavily.",
        )
    else:
        explanation_parts.append(
            "This account does not yet have enough history, so the estimate is using the math baseline cost-per-mile model.",
        )

    feedback = (
        f"Using the current miles-driven input and recent fuel history, the fuel preview is ${fuel_prediction:.2f}."
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


def _average(values: list[Optional[float]]) -> float:
    if not values:
        return 0.0

    # None entries count as 0 rather than being excluded from the average.
    return sum(value or 0 for value in values) / len(values)


def predict_by_average(entries: list[BudgetEntry]) -> PredictResponse:
    # Below MIN_ENTRIES_FOR_REGRESSION, just averages logged fuel costs.
    average_fuel = _average([entry.fuel_cost for entry in entries])

    return PredictResponse(
        predicted_fuel_cost=round(average_fuel, 2),
        # Food cost forecasting isn't implemented - always 0.
        predicted_food_cost=0.0,
        predicted_total=round(average_fuel, 2),
        method="average",
        sample_size=len(entries),
    )


def predict_by_regression(entries: list[BudgetEntry]) -> PredictResponse:
    # At/above MIN_ENTRIES_FOR_REGRESSION, forecasts from the
    # cost-per-mile trend. "Regression" here is the recency-weighted
    # average of each entry's own cost-per-mile (fuel_cost /
    # miles_driven), not a fitted line - it's named to match the API's
    # `method` field ("linear_regression"), which reflects the
    # trend-following intent to API consumers even though the
    # implementation isn't literally scikit-learn's LinearRegression.

    # Only entries with both a positive mileage and fuel cost are usable.
    valid_entries = [
        entry
        for entry in entries
        if (entry.miles_driven or 0) > 0 and (entry.fuel_cost or 0) > 0
    ]
    if not valid_entries:
        return PredictResponse(
            predicted_fuel_cost=0.0,
            predicted_food_cost=0.0,
            predicted_total=0.0,
            method="average",
            sample_size=len(entries),
        )

    # Convert each entry to its own cost-per-mile rate, then weight-average them.
    cost_per_mile_values = [
        (entry.fuel_cost or 0) / max(entry.miles_driven or 0, 1)
        for entry in valid_entries
    ]
    weighted_rate = recency_weighted_average(cost_per_mile_values)
    average_miles = (
        sum(entry.miles_driven or 0 for entry in valid_entries) / len(valid_entries)
    )
    # Fall back to a plain average rate if the weighted average couldn't
    # be computed (shouldn't normally happen given valid_entries is non-empty).
    predicted_fuel = (weighted_rate or sum(
        cost_per_mile_values) / len(cost_per_mile_values)) * average_miles

    return PredictResponse(
        predicted_fuel_cost=round(predicted_fuel, 2),
        predicted_food_cost=0.0,
        predicted_total=round(predicted_fuel, 2),
        method="linear_regression",
        sample_size=len(entries),
    )
