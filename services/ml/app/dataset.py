# Synthetic reference dataset used as the /ml-preview endpoint's math
# baseline. /ml-preview (the debug preview page, not the main /predict
# flow the real app uses) has no logged-in-user history to fall back on
# for a brand new account, so it needs *some* starting point for "how
# much does fuel usually cost per mile." This module generates a
# plausible 30-day dataset once, caches it to disk, and reuses it - a
# stand-in for real market data, not a live price feed.

import json
from pathlib import Path
from typing import Any

from .json_store import read_json

APP_DIR = Path(__file__).resolve().parent
ROOT = APP_DIR.parent
DATA_PATH = ROOT / "budget_data.json"

# A previously-generated dataset is only reused if its average
# cost-per-mile looks realistic - this guards against reusing a
# dataset with unrealistic numbers left over from an earlier,
# less-tuned generator.
MIN_PLAUSIBLE_COST_PER_MILE = 0.15


def _generate_rows() -> list[dict[str, Any]]:
    # 30 rows of synthetic (but realistic-looking) daily fuel/food spending.
    rows: list[dict[str, Any]] = []
    for index in range(1, 31):
        miles_driven = 100 + (index * 9) % 180
        fuel_price = round(3.2 + (index % 6) * 0.28, 2)
        combined_mpg = 24 + (index % 5) * 2
        gallons = round(miles_driven / combined_mpg, 2)
        fuel_cost = round(gallons * fuel_price + 20.0 + (index % 4) * 3.5, 2)
        meals = 8 + (index % 5) * 2
        food_cost = round(4.4 + meals * 1.1 + (index % 3) * 0.5, 2)
        rows.append(
            {
                "date": f"2026-01-{index:02d}",
                "fuel_cost": fuel_cost,
                "food_cost": food_cost,
                "miles_driven": miles_driven,
                "meals": meals,
                "fuel_price": fuel_price,
                "combined_mpg": combined_mpg,
                "gallons": gallons,
            }
        )
    return rows


def build_dataset() -> list[dict[str, Any]]:
    # Regenerates and overwrites budget_data.json if it's missing,
    # corrupt, or the cached data's average cost-per-mile looks
    # implausible; otherwise reuses what's already on disk so repeated
    # calls are stable.

    # Prefer a valid, plausible cached dataset over regenerating one.
    payload = read_json(DATA_PATH, default=None)
    if isinstance(payload, list) and payload:
        cost_per_mile = [
            float(item.get("fuel_cost", 0)) /
            float(item.get("miles_driven", 1) or 1)
            for item in payload
            if isinstance(item, dict) and float(item.get("miles_driven", 0) or 0) > 0
        ]
        if cost_per_mile and sum(cost_per_mile) / len(cost_per_mile) >= MIN_PLAUSIBLE_COST_PER_MILE:
            return payload

    # No usable cache - generate fresh rows, write them, and return them.
    rows = _generate_rows()
    DATA_PATH.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    return rows
