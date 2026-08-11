from app import main as ml_main
import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


class PredictionTests(unittest.TestCase):
    def test_build_prediction_uses_custom_inputs(self) -> None:
        result = ml_main.build_prediction(miles_driven=130)

        self.assertEqual(result["next_week"]["miles_driven"], 130)
        self.assertGreater(result["fuel_prediction"], 0)
        self.assertEqual(result["total_prediction"],
                         round(result["fuel_prediction"], 2))

    def test_build_prediction_blends_math_with_user_history(self) -> None:
        history_path = Path("/workspace/services/ml/user_history.json")
        existing = history_path.read_text(
            encoding="utf-8") if history_path.exists() else "{}"
        try:
            history_path.write_text(
                json.dumps({"guest": [{"miles_driven": 100, "fuel_price": 4.2, "combined_mpg": 26,
                           "tank_capacity": 14, "gallons": 4, "observed_cost": 16.8}]}),
                encoding="utf-8",
            )
            ml_main.HISTORY_PATH = history_path

            result = ml_main.build_prediction(
                miles_driven=130,
                user_id="guest",
                fuel_price=4.2,
                combined_mpg=26,
                tank_capacity=14,
                gallons=4,
            )

            self.assertGreaterEqual(result["history_count"], 1)
            self.assertIn("history", result["feedback"].lower())
            self.assertGreater(result["fuel_prediction"], 0)
            self.assertNotIn("food", result["feedback"].lower())
            self.assertIn("70%", result["explanation"])
        finally:
            if existing == "{}":
                history_path.unlink(missing_ok=True)
            else:
                history_path.write_text(existing, encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
