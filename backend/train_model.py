import os
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score

# =====================================================
# LOAD DATA
# =====================================================

csv_path = os.path.join(
    "logs",
    "traffic_logs.csv"
)

print(
    f"Loading dataset from: {csv_path}"
)

df = pd.read_csv(csv_path)

print(
    f"Total rows before cleaning: {len(df)}"
)

print("\nColumns found:")
print(df.columns.tolist())

# =====================================================
# REQUIRED COLUMNS
# =====================================================

required_columns = [

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
    "trucks",

    "pollution",
    "congestion_score"
]

missing_columns = [

    col

    for col in required_columns

    if col not in df.columns

]

if missing_columns:

    raise ValueError(

        f"Missing columns in CSV: "
        f"{missing_columns}"

    )

# =====================================================
# KEEP ONLY REQUIRED COLUMNS
# =====================================================

df = df[
    required_columns
].copy()

# =====================================================
# CONVERT TO NUMERIC
# =====================================================

for col in required_columns:

    df[col] = pd.to_numeric(

        df[col],

        errors="coerce"

    )

# =====================================================
# CLEAN DATA
# =====================================================

print("\nNaN values found:")

print(
    df.isna().sum()
)

df = df.dropna()

print(
    f"\nRows after cleaning: {len(df)}"
)

if len(df) == 0:

    raise ValueError(

        "Dataset became empty after cleaning."

    )

# =====================================================
# FEATURES
# =====================================================

feature_columns = [

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

X = df[
    feature_columns
]

# =====================================================
# TARGETS
# =====================================================

y_aqi = df[
    "pollution"
]

y_congestion = df[
    "congestion_score"
]

# =====================================================
# TRAIN AQI MODEL
# =====================================================

X_train, X_test, y_train, y_test = train_test_split(

    X,

    y_aqi,

    test_size=0.2,

    random_state=42

)

aqi_model = RandomForestRegressor(

    n_estimators=300,

    max_depth=15,

    random_state=42,

    n_jobs=-1

)

aqi_model.fit(

    X_train,

    y_train

)

aqi_predictions = aqi_model.predict(
    X_test
)

aqi_r2 = r2_score(

    y_test,

    aqi_predictions

)

print(
    f"\nAQI Model R² Score: {aqi_r2:.4f}"
)

# =====================================================
# TRAIN CONGESTION MODEL
# =====================================================

X_train2, X_test2, y_train2, y_test2 = train_test_split(

    X,

    y_congestion,

    test_size=0.2,

    random_state=42

)

congestion_model = RandomForestRegressor(

    n_estimators=300,

    max_depth=15,

    random_state=42,

    n_jobs=-1

)

congestion_model.fit(

    X_train2,

    y_train2

)

congestion_predictions = congestion_model.predict(
    X_test2
)

congestion_r2 = r2_score(

    y_test2,

    congestion_predictions

)

print(

    f"Congestion Model R² Score: "
    f"{congestion_r2:.4f}"

)

# =====================================================
# FEATURE IMPORTANCE
# =====================================================

print("\nAQI Feature Importance")

for name, importance in zip(

    feature_columns,

    aqi_model.feature_importances_

):

    print(

        f"{name:<20}"
        f"{importance:.4f}"

    )

print("\nCongestion Feature Importance")

for name, importance in zip(

    feature_columns,

    congestion_model.feature_importances_

):

    print(

        f"{name:<20}"
        f"{importance:.4f}"

    )

# =====================================================
# SAVE MODELS
# =====================================================

os.makedirs(

    "models",

    exist_ok=True

)

joblib.dump(

    aqi_model,

    "models/pollution_model.pkl"

)

joblib.dump(

    congestion_model,

    "models/congestion_model.pkl"

)

print("\nModels trained successfully.")

print(
    "Saved:"
)

print(
    " - models/pollution_model.pkl"
)

print(
    " - models/congestion_model.pkl"
)