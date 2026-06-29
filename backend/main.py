from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from ultralytics import YOLO

import cv2
import numpy as np
import pandas as pd

from datetime import datetime

import os
import joblib

pollution_model = joblib.load(
    "models/pollution_model.pkl"
)

congestion_model = joblib.load(
    "models/congestion_model.pkl"
)

# ---------------- APP ----------------
app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- YOLO MODEL ----------------
model = YOLO("yolov8m.pt")

# ---------------- VEHICLE CLASSES ----------------
VEHICLE_CLASSES = [
    "car",
    "motorcycle",
    "bus",
    "truck"
]

# ---------------- POLLUTION FACTORS ----------------
EMISSION_FACTORS = {
    "car": 120,
    "motorcycle": 50,
    "bus": 800,
    "truck": 1000
}

# ---------------- LOAD ML MODELS ----------------
try:

    pollution_model = joblib.load(
        "models/pollution_model.pkl"
    )

    congestion_model = joblib.load(
        "models/congestion_model.pkl"
    )

    print("Prediction models loaded")

except Exception as e:

    pollution_model = None

    congestion_model = None

    print("Prediction models not found:", e)

# ---------------- TRAFFIC LEVEL ----------------
def get_traffic_level(count):

    if count < 10:
        return "LOW"

    elif count < 30:
        return "MEDIUM"

    else:
        return "HIGH"

# ---------------- SIGNAL SYSTEM ----------------
def get_signal_recommendation(count, level):

    if level == "LOW":

        return {
            "green_duration": 30,
            "priority": "NORMAL",
            "action": "Standard cycle — low traffic",
            "vehicles_per_cycle": count
        }

    elif level == "MEDIUM":

        return {
            "green_duration": 60,
            "priority": "MODERATE",
            "action": "Extended green — moderate congestion",
            "vehicles_per_cycle": count
        }

    else:

        return {
            "green_duration": 90,
            "priority": "HIGH",
            "action": "Maximum green + alert traffic control",
            "vehicles_per_cycle": count
        }

# ---------------- CONGESTION SCORE ----------------
def get_congestion_score(count):

    return min(
        100,
        int((count / 50) * 100)
    )

# ---------------- SAVE LOGS ----------------
def save_log(response):

    current = datetime.now()

    month = current.month
    day_of_year = current.timetuple().tm_yday
    day_of_week = current.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0
    hour = current.hour

    location = {
        "lat": response["lat"],
        "lng": response["lng"]
    }

    vehicle_count = response["vehicle_count"]

    cars = response["vehicle_breakdown"]["car"]
    motorcycles = response["vehicle_breakdown"]["motorcycle"]
    buses = response["vehicle_breakdown"]["bus"]
    trucks = response["vehicle_breakdown"]["truck"]

    pollution = response["estimated_pollution"]["co2_estimate"]

    congestion_score = response["congestion_score"]

    row = {

        "date":
            current.strftime("%Y-%m-%d"),

        "month":
            month,

        "day_of_year":
            day_of_year,

        "day_of_week":
            day_of_week,

        "is_weekend":
            is_weekend,

        "hour":
            hour,

        "minute":
            current.minute,

        "lat":
            location["lat"],

        "lng":
            location["lng"],

        # "location":
        #     location["name"],

        "vehicle_count":
            vehicle_count,

        "cars":
            cars,

        "motorcycles":
            motorcycles,

        "buses":
            buses,

        "trucks":
            trucks,

        "pollution":
            pollution,

        "congestion_score":
            congestion_score
    }

    os.makedirs("logs", exist_ok=True)

    csv_file = "logs/master_urban_traffic_logs.csv"

    df = pd.DataFrame([row])

    if os.path.exists(csv_file):
        df.to_csv(
            csv_file,
            mode="a",
            header=False,
            index=False
        )
    else:
        df.to_csv(
            csv_file,
            index=False
        )

    print("Log saved successfully")

    

# ---------------- LOCATION FORECAST ----------------
def get_live_forecast(lat, lng):

    file = "logs/master_urban_traffic_logs.csv"

    if not os.path.exists(file):

        return {

            "predicted_aqi": None,

            "predicted_congestion": None,

            "samples": 0,

            "hour_window": "N/A",

            "day": "Unknown",

            "weekend": False,

            "location_based": False,

            "trend": "Unknown",

            "message":
                "No historical data available"
        }

    try:

        df = pd.read_csv(file)

        print(
            "Dataset loaded for forecasting"
        )

    except Exception as e:

        print(
            "CSV read error:",
            e
        )

        return {

            "predicted_aqi": None,

            "predicted_congestion": None,

            "samples": 0,

            "hour_window": "N/A",

            "day": "Unknown",

            "weekend": False,

            "location_based": False,

            "trend": "Unknown",

            "message":
                "Could not read traffic logs"
        }

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

    missing = [

        col

        for col in required_columns

        if col not in df.columns

    ]

    if missing:

        return {

            "predicted_aqi": None,

            "predicted_congestion": None,

            "samples": 0,

            "hour_window": "N/A",

            "day": "Unknown",

            "weekend": False,

            "location_based": False,

            "trend": "Unknown",

            "message":
                f"Missing columns: {missing}"
        }

    now = datetime.now()

    current_hour = now.hour

    current_day = now.weekday()

    current_month = now.month

    current_day_of_year = (
        now.timetuple().tm_yday
    )

    is_weekend = (
        1 if current_day >= 5
        else 0
    )

    # ---------------- LOCATION FILTER ----------------

    location_radius = 0.05

    filtered = df[

        (df["hour"] == current_hour)

        &

        (df["is_weekend"] == is_weekend)

        &

        (
            abs(
                df["lat"] - lat
            ) <= location_radius
        )

        &

        (
            abs(
                df["lng"] - lng
            ) <= location_radius
        )

    ]

    # ---------------- NO DATA ----------------

    if len(filtered) < 5:

        return {

            "predicted_aqi": None,

            "predicted_congestion": None,

            "samples": len(filtered),

            "hour_window":
                f"{current_hour}:00 - {current_hour + 1}:00",

            "day":
                now.strftime("%A"),

            "weekend":
                bool(is_weekend),

            "location_based":
                False,

            "trend":
                "Unknown",

            "message":
                "No historical traffic data available for this location"
        }

    # ---------------- TREND DETECTION ----------------

    try:

        trend_df = filtered.sort_values(
            "day_of_year"
        )

        first_avg = (

            trend_df[
                "vehicle_count"
            ]

            .head(20)

            .mean()

        )

        last_avg = (

            trend_df[
                "vehicle_count"
            ]

            .tail(20)

            .mean()

        )

        if last_avg > first_avg:

            trend = "Increasing"

        elif last_avg < first_avg:

            trend = "Decreasing"

        else:

            trend = "Stable"

    except Exception:

        trend = "Unknown"

    # ---------------- FEATURE VECTOR ----------------

    feature_df = pd.DataFrame([{
        "lat": float(lat),
        "lng": float(lng),
        "month": current_month,
        "day_of_year": current_day_of_year,
        "day_of_week": current_day,
        "is_weekend": is_weekend,
        "hour": current_hour,
        "vehicle_count": filtered["vehicle_count"].mean(),
        "cars": filtered["cars"].mean(),
        "motorcycles": filtered["motorcycles"].mean(),
        "buses": filtered["buses"].mean(),
        "trucks": filtered["trucks"].mean()
    }])

    # ---------------- ML FORECAST ----------------

    try:

        if (

            pollution_model is not None

            and

            congestion_model is not None

        ):

            predicted_aqi = (

                pollution_model

                .predict(feature_df)[0]

            )

            predicted_congestion = (

                congestion_model

                .predict(feature_df)[0]

            )

        else:

            raise Exception(
                "Models not loaded"
            )

    except Exception as e:

        print(

            "Forecast prediction error:",

            e

        )

        predicted_aqi = (

            filtered[
                "pollution"
            ]

            .mean()

        )

        predicted_congestion = (

            filtered[
                "congestion_score"
            ]

            .mean()

        )

    return {

        "predicted_aqi":

            round(
                float(
                    predicted_aqi
                ),
                2
            ),

        "predicted_congestion":

            round(
                float(
                    predicted_congestion
                ),
                2
            ),

        "samples":
            len(filtered),

        "hour_window":
            f"{current_hour}:00 - {current_hour + 1}:00",

        "day":
            now.strftime("%A"),

        "weekend":
            bool(is_weekend),

        "location_based":
            True,

        "trend":
            trend,

        "message":
            "Random Forest forecast"
    }

# ---------------- PREDICT API ----------------
@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    lat: float = 18.6298,
    lng: float = 73.7997
):

    # ---------------- READ IMAGE ----------------
    contents = await file.read()

    nparr = np.frombuffer(
        contents,
        np.uint8
    )

    img = cv2.imdecode(
        nparr,
        cv2.IMREAD_COLOR
    )

    # ---------------- UPSCALE ----------------
    img = cv2.resize(
        img,
        None,
        fx=4,
        fy=4,
        interpolation=cv2.INTER_CUBIC
    )

    # ---------------- YOLO ----------------
    results = model(
        img,
        imgsz=1280,
        conf=0.1,
        iou=0.4
    )

    vehicle_count = 0

    vehicle_counts = {
        "car": 0,
        "motorcycle": 0,
        "bus": 0,
        "truck": 0
    }

    total_pollution = 0

    # ---------------- DETECTION ----------------
    for result in results:

        boxes = result.boxes

        for box in boxes:

            cls_id = int(box.cls[0])

            confidence = float(box.conf[0])

            class_name = model.names[cls_id]

            if class_name in VEHICLE_CLASSES:

                vehicle_count += 1

                vehicle_counts[class_name] += 1

                total_pollution += EMISSION_FACTORS[
                    class_name
                ]

                # DRAW BOX
                x1, y1, x2, y2 = map(
                    int,
                    box.xyxy[0]
                )

                cv2.rectangle(
                    img,
                    (x1, y1),
                    (x2, y2),
                    (0, 255, 0),
                    2
                )

                cv2.putText(
                    img,
                    f"{class_name} {confidence:.2f}",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 0),
                    2
                )

    # ---------------- SAVE OUTPUT ----------------
    os.makedirs("outputs", exist_ok=True)

    cv2.imwrite(
        "outputs/output.jpg",
        img
    )

    # ---------------- TRAFFIC ----------------
    level = get_traffic_level(
        vehicle_count
    )

    signal = get_signal_recommendation(
        vehicle_count,
        level
    )

    congestion_score = get_congestion_score(
        vehicle_count
    )

    # ---------------- TIME ----------------
    now = datetime.now()

    # ---------------- FEATURES ----------------
    feature_df = pd.DataFrame([{
        "lat": lat,
        "lng": lng,
        "month": now.month,
        "day_of_year": now.timetuple().tm_yday,
        "day_of_week": now.weekday(),
        "is_weekend": 1 if now.weekday() >= 5 else 0,
        "hour": now.hour,
        "vehicle_count": vehicle_count,
        "cars": vehicle_counts["car"],
        "motorcycles": vehicle_counts["motorcycle"],
        "buses": vehicle_counts["bus"],
        "trucks": vehicle_counts["truck"]
    }])

    # ---------------- ML PREDICTION ----------------
    try:

        if pollution_model and congestion_model:

            future_aqi = pollution_model.predict(
                feature_df
            )[0]

            future_congestion = congestion_model.predict(
                feature_df
            )[0]

        else:

            future_aqi = total_pollution

            future_congestion = congestion_score

    except Exception as e:

        print("Prediction error:", e)

        future_aqi = total_pollution

        future_congestion = congestion_score

    # ---------------- RESPONSE ----------------
    response = {

        "vehicle_count":
            vehicle_count,

        "vehicle_breakdown":
            vehicle_counts,

        "estimated_pollution": {

            "co2_estimate":
                total_pollution,

            "unit":
                "g/km"
        },

        "traffic_level":
            level,

        "signal_recommendation":
            signal,

        "congestion_score":
            congestion_score,

        "prediction": {

            "predicted_aqi":
                round(future_aqi, 2),

            "predicted_congestion":
                round(future_congestion, 2),

            "current_day":
                now.strftime("%A"),

            "weekend":
                now.weekday() >= 5,

            "prediction_window":
                f"{now.hour}:00 - {now.hour+1}:00"
        },

        "lat":
            lat,

        "lng":
            lng
    }

    # ---------------- SAVE LOG ----------------
    save_log(response)
    

    return response

# ---------------- FORECAST API ----------------
@app.get("/forecast")
async def forecast(

    lat: float,

    lng: float

):

    prediction = get_live_forecast(
        lat,
        lng
    )

    return {

        "success": True,

        "forecast": prediction
    }

# ---------------- ROOT ----------------
@app.get("/")
async def root():

    return {
        "message":
            "AI Traffic Analyzer Running"
    }