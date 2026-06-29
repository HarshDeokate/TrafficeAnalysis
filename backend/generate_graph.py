import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import pandas as pd

import os

print("Current Working Directory:")
print(os.getcwd())

# Load dataset
df = pd.read_csv("C:\\Users\\harsh\\OneDrive\\Desktop\\BE Project\\Traffic-analysis\\backend\\logs\\master_urban_traffic_logs.csv")

# Feature columns
X = df[
    [
        "lat",
        "lng",
        "month",
        "day_of_year",
        "day_of_week",
        "is_weekend",
        "hour",
        "vehicle_count",
        "cars",
        "motorcycles",
        "buses",
        "trucks"
    ]
]

# Target
y = df["pollution"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Train model
rf = RandomForestRegressor(
    n_estimators=200,
    max_depth=12,
    random_state=42
)

rf.fit(X_train, y_train)

# Predictions
y_pred = rf.predict(X_test)

# ---------------- Plot ---------------- #

plt.figure(figsize=(7,6))

plt.scatter(
    y_test,
    y_pred,
    alpha=0.6
)

plt.plot(
    [y_test.min(), y_test.max()],
    [y_test.min(), y_test.max()],
    'r--',
    linewidth=2
)

plt.xlabel("Actual AQI")
plt.ylabel("Predicted AQI")
plt.title("Random Forest Prediction Performance")

plt.grid(True)

plt.savefig(
    "random_forest_prediction.png",
    dpi=300,
    bbox_inches="tight"
)

plt.show()