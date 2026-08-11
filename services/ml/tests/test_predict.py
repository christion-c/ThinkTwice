from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_predict_rejects_empty_entries():
    response = client.post("/predict", json={"entries": []})

    assert response.status_code == 422


def test_predict_falls_back_to_average_below_the_regression_threshold():
    response = client.post(
        "/predict",
        json={
            "entries": [
                {
                    "date": "2026-08-01",
                    "fuelCost": 60,
                    "foodCost": 20,
                    "milesDriven": 150,
                    "meals": 14,
                },
                {
                    "date": "2026-08-08",
                    "fuelCost": 70,
                    "foodCost": 30,
                    "milesDriven": 160,
                    "meals": 16,
                },
            ]
        },
    )

    assert response.status_code == 200
    body = response.json()

    assert body["method"] == "average"
    assert body["sampleSize"] == 2
    assert body["predictedFuelCost"] == 65.0
    assert body["predictedFoodCost"] == 25.0
    assert body["predictedTotal"] == 90.0


def test_predict_uses_regression_at_the_threshold_and_beyond():
    entries = [
        {
            "date": f"2026-08-{day:02d}",
            "fuelCost": 10 + miles * 0.1,
            "foodCost": 5 + meals * 2,
            "milesDriven": miles,
            "meals": meals,
        }
        for day, (miles, meals) in enumerate(
            [(100, 10), (150, 12), (200, 14), (250, 16)], start=1
        )
    ]

    response = client.post("/predict", json={"entries": entries})

    assert response.status_code == 200
    body = response.json()

    assert body["method"] == "linear_regression"
    assert body["sampleSize"] == 4
    assert body["predictedFuelCost"] > 0
    assert body["predictedFoodCost"] > 0
    assert body["predictedTotal"] == round(
        body["predictedFuelCost"] + body["predictedFoodCost"], 2
    )


def test_predict_rejects_a_negative_cost():
    response = client.post(
        "/predict",
        json={
            "entries": [
                {"date": "2026-08-01", "fuelCost": -5},
            ]
        },
    )

    assert response.status_code == 422


def test_predict_rejects_a_malformed_date():
    response = client.post(
        "/predict",
        json={"entries": [{"date": "not-a-date"}]},
    )

    assert response.status_code == 422
