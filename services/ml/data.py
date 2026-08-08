import json
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

# Load data
with open("budget_data.json") as f:
    data = json.load(f)

df = pd.DataFrame(data)

# Features and labels
X = df[["miles_driven", "meals"]]
y_fuel = df["fuel_cost"]
y_food = df["food_cost"]

# Train models
fuel_model = LinearRegression()
food_model = LinearRegression()

fuel_model.fit(X, y_fuel)
food_model.fit(X, y_food)

# Predict next week
next_week = {
    "miles_driven": 120,
    "meals": 14
}

fuel_pred = fuel_model.predict([[next_week["miles_driven"], next_week["meals"]]])[0]
food_pred = food_model.predict([[next_week["miles_driven"], next_week["meals"]]])[0]

print("Predicted fuel cost:", round(fuel_pred, 2))
print("Predicted food cost:", round(food_pred, 2))
print("Total budget:", round(fuel_pred + food_pred, 2))
