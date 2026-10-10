import json
from unittest.mock import patch

from app import dataset as ml_dataset


def test_build_dataset_generates_and_caches_on_cache_miss(tmp_path, monkeypatch):
    data_path = tmp_path / "budget_data.json"
    monkeypatch.setattr(ml_dataset, "DATA_PATH", data_path)

    assert not data_path.exists()

    rows = ml_dataset.build_dataset()

    assert len(rows) == 30
    assert data_path.exists()
    cached = json.loads(data_path.read_text(encoding="utf-8"))
    assert cached == rows


def test_build_dataset_reuses_valid_cache_without_regenerating(tmp_path, monkeypatch):
    data_path = tmp_path / "budget_data.json"
    monkeypatch.setattr(ml_dataset, "DATA_PATH", data_path)

    first = ml_dataset.build_dataset()

    with patch.object(ml_dataset, "_generate_rows") as mock_generate:
        second = ml_dataset.build_dataset()

    mock_generate.assert_not_called()
    assert second == first


def test_build_dataset_falls_back_to_fresh_rows_on_corrupt_cache(tmp_path, monkeypatch):
    data_path = tmp_path / "budget_data.json"
    data_path.write_text("this is not valid json", encoding="utf-8")
    monkeypatch.setattr(ml_dataset, "DATA_PATH", data_path)

    rows = ml_dataset.build_dataset()

    assert len(rows) == 30
    # The corrupt cache should have been overwritten with the freshly
    # generated, valid dataset.
    cached = json.loads(data_path.read_text(encoding="utf-8"))
    assert cached == rows


def test_build_dataset_regenerates_when_cached_cost_per_mile_is_implausible(tmp_path, monkeypatch):
    data_path = tmp_path / "budget_data.json"
    # Every row's fuel_cost / miles_driven is far below
    # MIN_PLAUSIBLE_COST_PER_MILE, so the cache should be treated as stale.
    implausible_rows = [{"date": "2026-01-01", "fuel_cost": 0.01, "miles_driven": 100}]
    data_path.write_text(json.dumps(implausible_rows), encoding="utf-8")
    monkeypatch.setattr(ml_dataset, "DATA_PATH", data_path)

    rows = ml_dataset.build_dataset()

    assert len(rows) == 30
    assert rows != implausible_rows


def test_generated_rows_cost_exactly_gallons_times_price():
    rows = ml_dataset._generate_rows()

    for row in rows:
        assert row["fuel_cost"] == round(row["gallons"] * row["fuel_price"], 2)


def test_build_dataset_regenerates_a_cache_whose_fuel_cost_is_not_gallons_times_price(
    tmp_path, monkeypatch
):
    data_path = tmp_path / "budget_data.json"
    # A row from the old generator: gallons x price plus a flat $20.
    old_rows = [
        {
            "date": "2026-01-01",
            "fuel_cost": round(4.0 * 3.5 + 20.0, 2),
            "miles_driven": 112,
            "fuel_price": 3.5,
            "gallons": 4.0,
        }
    ]
    data_path.write_text(json.dumps(old_rows), encoding="utf-8")
    monkeypatch.setattr(ml_dataset, "DATA_PATH", data_path)

    rows = ml_dataset.build_dataset()

    assert len(rows) == 30
    assert rows != old_rows
