import os
import joblib
import numpy as np
import pandas as pd

from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import r2_score

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

# =====================================================
# LOAD DATA
# =====================================================

df = pd.read_csv(
    "logs/traffic_logs.csv"
)

# sort by time

df = df.sort_values([
    "day_of_year",
    "hour"
])

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
].values

# =====================================================
# TARGET
# =====================================================

y = df[
    "pollution"
].values

# =====================================================
# SCALE
# =====================================================

x_scaler = MinMaxScaler()

X = x_scaler.fit_transform(
    X
)

joblib.dump(
    x_scaler,
    "models/lstm_scaler.pkl"
)

# =====================================================
# CREATE SEQUENCES
# =====================================================

WINDOW = 24

X_seq = []

y_seq = []

for i in range(
    WINDOW,
    len(X)
):

    X_seq.append(
        X[i-WINDOW:i]
    )

    y_seq.append(
        y[i]
    )

X_seq = np.array(
    X_seq
)

y_seq = np.array(
    y_seq
)

# =====================================================
# SPLIT
# =====================================================

split = int(
    len(X_seq) * 0.8
)

X_train = X_seq[:split]
X_test = X_seq[split:]

y_train = y_seq[:split]
y_test = y_seq[split:]

# =====================================================
# MODEL
# =====================================================

model = Sequential([

    LSTM(
        64,
        return_sequences=True,
        input_shape=(
            WINDOW,
            X_seq.shape[2]
        )
    ),

    Dropout(0.2),

    LSTM(32),

    Dense(16),

    Dense(1)

])

model.compile(

    optimizer="adam",

    loss="mse"

)

# =====================================================
# TRAIN
# =====================================================

history = model.fit(

    X_train,

    y_train,

    epochs=20,

    batch_size=32,

    validation_split=0.1,

    verbose=1

)

# =====================================================
# EVALUATE
# =====================================================

predictions = model.predict(
    X_test
)

r2 = r2_score(
    y_test,
    predictions
)

print(
    f"LSTM AQI R² Score: {r2:.4f}"
)

# =====================================================
# SAVE
# =====================================================

model.save(
    "models/lstm_aqi_model.keras"
)

print(
    "LSTM model saved"
)