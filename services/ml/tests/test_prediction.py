from app import prediction as ml_prediction
from app.models import BudgetEntry
from app.prediction import (
    FALLBACK_COST_PER_MILE,
    MIN_ENTRIES_FOR_REGRESSION,
    _baseline_cost_per_mile,
    _blend_with_history,
    _build_explanation,
    predict_by_regression,
    recency_weighted_average,
)


def test_recency_weighted_average_returns_none_for_empty_list():
    assert recency_weighted_average([]) is None


def test_recency_weighted_average_returns_the_only_value_for_a_single_entry():
    assert recency_weighted_average([42.0]) == 42.0


def test_recency_weighted_average_returns_none_when_every_value_is_non_positive():
    assert recency_weighted_average([0.0, -5.0, -1.0]) is None


def test_predict_by_regression_falls_back_to_the_plain_average_when_no_entry_has_miles_and_cost():
    # At/above MIN_ENTRIES_FOR_REGRESSION so /predict would route here,
    # but no entry has both positive miles and cost - valid_entries
    # ends up empty, a distinct branch from the "entries list itself is
    # empty" case (which /predict rejects with a 422 before this
    # function is ever called). The forecast is the plain average of
    # logged fuel costs, not $0.
    entries = [
        BudgetEntry(date="2026-08-01", fuelCost=0, milesDriven=100),
        BudgetEntry(date="2026-08-08", fuelCost=50, milesDriven=0),
        BudgetEntry(date="2026-08-15", fuelCost=40, milesDriven=0),
    ]
    assert len(entries) >= MIN_ENTRIES_FOR_REGRESSION

    result = predict_by_regression(entries)

    assert result.method == "average"
    assert result.predicted_fuel_cost == 30.0
    assert result.predicted_total == 30.0
    assert result.sample_size == len(entries)


def test_recency_weighted_average_keeps_decaying_past_the_fourth_entry():
    # Two recent entries at 10, then a long tail of old entries at 100.
    # With a flat weight floor the old tail used to dominate (the result
    # drifted toward 100 as history grew); with geometric decay the
    # result stays close to the recent entries however long the tail is.
    short = recency_weighted_average([10.0, 10.0] + [100.0] * 5)
    long = recency_weighted_average([10.0, 10.0] + [100.0] * 200)

    assert short is not None and long is not None
    # The whole tail adds at most 4/3 of weight against the first two's 7:
    # (7 * 10 + 4/3 * 100) / (7 + 4/3) = 24.4.
    assert long < 24.5
    assert long - short < 3.0


def test_recency_weighted_average_keeps_the_third_and_fourth_weights():
    # Weights 1, 6, 1/3, 1/4 for the first four entries.
    values = [1.0, 2.0, 3.0, 4.0]
    expected = (1 * 1.0 + 6 * 2.0 + (1 / 3) * 3.0 + 0.25 * 4.0) / (1 + 6 + 1 / 3 + 0.25)

    assert abs(recency_weighted_average(values) - expected) < 1e-9


def test_explanation_pluralizes_entry_correctly():
    one = _build_explanation(30, 120, 16.8, 1, True, 0.7)
    many = _build_explanation(30, 120, 16.8, 4, True, 0.85)

    assert "1 saved fill-up entry in history" in one
    assert "4 saved fill-up entries in history" in many
    assert "entryy" not in one and "entryies" not in many


def test_blend_with_history_returns_unblended_baseline_when_history_is_empty(monkeypatch):
    monkeypatch.setattr(ml_prediction, "load_user_history", lambda user_id=None: [])

    fuel_prediction, history_count, blended, blend_weight = _blend_with_history(
        user_id="no-history-user", miles_driven=120, baseline_prediction=30.0
    )

    assert fuel_prediction == 30.0
    assert history_count == 0
    assert blended is False
    assert blend_weight == 0.0


def test_blend_with_history_weight_at_one_entry(monkeypatch):
    # blend_weight = min(0.9, 0.65 + 0.05 * min(history_count, 10))
    # history_count=1 -> 0.65 + 0.05 = 0.70
    fake_history = [{"observed_cost": 40.0, "miles_driven": 100}]
    monkeypatch.setattr(ml_prediction, "load_user_history", lambda user_id=None: fake_history)

    _, history_count, blended, blend_weight = _blend_with_history(
        user_id="one-entry-user", miles_driven=100, baseline_prediction=30.0
    )

    assert history_count == 1
    assert blended is True
    assert round(blend_weight, 2) == 0.70


def test_blend_with_history_weight_caps_at_ninety_percent_by_ten_entries(monkeypatch):
    # history_count=10 -> 0.65 + 0.05*10 = 1.15, capped to 0.90 (the cap).
    fake_history = [{"observed_cost": 40.0, "miles_driven": 100} for _ in range(10)]
    monkeypatch.setattr(ml_prediction, "load_user_history", lambda user_id=None: fake_history)

    _, history_count, blended, blend_weight = _blend_with_history(
        user_id="ten-entry-user", miles_driven=100, baseline_prediction=30.0
    )

    assert history_count == 10
    assert blended is True
    assert round(blend_weight, 2) == 0.90


def test_blend_with_history_weight_stays_capped_beyond_ten_entries(monkeypatch):
    # history_count=15 -> min(history_count, 10) still clamps the
    # formula's input to 10, so the weight doesn't grow past the cap
    # just because there's even more history.
    fake_history = [{"observed_cost": 40.0, "miles_driven": 100} for _ in range(15)]
    monkeypatch.setattr(ml_prediction, "load_user_history", lambda user_id=None: fake_history)

    _, history_count, blended, blend_weight = _blend_with_history(
        user_id="many-entries-user", miles_driven=100, baseline_prediction=30.0
    )

    assert history_count == 15
    assert blended is True
    assert round(blend_weight, 2) == 0.90


def test_baseline_cost_per_mile_falls_back_to_a_flat_rate_when_rows_are_unusable():
    # Every row has zero miles, so _rates filters all of them out and
    # the function falls back to its documented flat-rate default
    # rather than dividing by zero.
    unusable_rows = [{"fuel_cost": 10.0, "miles_driven": 0} for _ in range(5)]

    assert _baseline_cost_per_mile(unusable_rows) == FALLBACK_COST_PER_MILE


def test_baseline_cost_per_mile_falls_back_for_empty_rows():
    assert _baseline_cost_per_mile([]) == FALLBACK_COST_PER_MILE
