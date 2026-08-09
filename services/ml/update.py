import json
from datetime import datetime

def update_budget_json(fuel_cost, food_cost, miles_driven, meals):
    new_entry = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "fuel_cost": fuel_cost,
        "food_cost": food_cost,
        "miles_driven": miles_driven,
        "meals": meals
    }

    # Try to load existing JSON
    try:
        with open("budget_data.json", "r") as f:
            data = json.load(f)
    except FileNotFoundError:
        data = []  # Create new list if file doesn't exist

    # Add new entry
    data.append(new_entry)

    # Save updated JSON
    with open("budget_data.json", "w") as f:
        json.dump(data, f, indent=4)

    print("Budget updated automatically!")
