import os
import random
from datetime import datetime, timedelta
import pandas as pd

# ---------------- CONFIGURATION ----------------
# Unique coordinates map directly to our 4 distinct locations
LOCATIONS = {
    "college": {"lat": 18.457545, "lng": 73.850812},      # PICT College
    "hospital": {"lat": 18.491200, "lng": 73.856800},     # Sahyadri Hospital
    "residential": {"lat": 18.468700, "lng": 73.791500},  # Nanded City Residential
    "mall": {"lat": 18.504200, "lng": 73.878400}          # Kumar Pacific Mall
}

start_date = datetime(2024, 1, 1)
all_rows = []

# ~2 years of hourly observations (15000 hours ≈ 625 days)
for i in range(15000):
    current = start_date + timedelta(hours=i)
    hour = current.hour
    day_of_week = current.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0
    month = current.month
    day_of_year = current.timetuple().tm_yday

    for loc_type, coords in LOCATIONS.items():
        base_traffic = 0
        
        # ---------------- 1. LOCATION-SPECIFIC TIME LOGIC ----------------
        if loc_type == "college":
            if 8 <= hour <= 9:        # Sharp morning lecture entry
                base_traffic = random.randint(120, 220)
            elif 12 <= hour <= 14:    # Lunch hour track
                base_traffic = random.randint(60, 100)
            elif 16 <= hour <= 18:    # Dispersal rush / Labs ending
                base_traffic = random.randint(130, 250)
            elif 0 <= hour <= 6:      # Empty campus lanes at night
                base_traffic = random.randint(1, 10)
            else:
                base_traffic = random.randint(30, 70)
                
            # College Specific Multipliers (Weekends & SPPU Holidays)
            if is_weekend:
                base_traffic = int(base_traffic * 0.30)
            if month in [5, 6]:       # Core Summer Vacation
                base_traffic = int(base_traffic * 0.25)
            elif month == 11:         # Diwali Term break
                base_traffic = int(base_traffic * 0.40)

        elif loc_type == "hospital":
            if 9 <= hour <= 12:       # Morning OPD Rush
                base_traffic = random.randint(100, 180)
            elif 17 <= hour <= 20:     # Evening Visitor Rush
                base_traffic = random.randint(110, 160)
            elif 0 <= hour <= 5:       # Emergency Night Traffic
                base_traffic = random.randint(15, 35)
            else:
                base_traffic = random.randint(50, 90)
                
            # Sunday OPD closure adjustment
            if is_weekend and day_of_week == 6:
                base_traffic = int(base_traffic * 0.60)

        elif loc_type == "residential":
            if 8 <= hour <= 10:       # Morning Office/School Exodus
                base_traffic = random.randint(120, 200)
            elif 18 <= hour <= 21:     # Evening Return Peak
                base_traffic = random.randint(130, 220)
            elif 11 <= hour <= 16:     # Quiet Daytime
                base_traffic = random.randint(30, 60)
            elif 0 <= hour <= 5:       # Sleep Hours
                base_traffic = random.randint(5, 15)
            else:
                base_traffic = random.randint(40, 80)
                
            # Weekends smooth out residential traffic evenly across midday
            if is_weekend and (11 <= hour <= 20):
                base_traffic = random.randint(80, 130)

        elif loc_type == "mall":
            if 16 <= hour <= 22:       # Core Evening Retail hours
                base_traffic = random.randint(150, 300) if is_weekend else random.randint(80, 150)
            elif 11 <= hour <= 15:     # Lunch/Movie slots
                base_traffic = random.randint(70, 140) if is_weekend else random.randint(40, 70)
            elif 0 <= hour <= 9:       # Closed/Restocking window
                base_traffic = random.randint(2, 12)
            else:
                base_traffic = random.randint(40, 80)

        # ---------------- 2. VEHICLE MIX PARAMETERS ----------------
        if loc_type == "college":
            # Massive motorcycle concentration (Pune Student profile)
            motorcycles = int(base_traffic * random.uniform(0.75, 0.85))
            cars = int(base_traffic * random.uniform(0.08, 0.15))
            buses = random.randint(1, 4) if (7 <= hour <= 21) else random.randint(0, 1)
            trucks = random.randint(0, 1) if (7 <= hour <= 21) else random.randint(1, 3)
            
        elif loc_type == "hospital":
            # High proportion of cabs/ambulances and standard cars
            cars = int(base_traffic * random.uniform(0.40, 0.55))
            motorcycles = int(base_traffic * random.uniform(0.35, 0.45))
            buses = random.randint(3, 10)  # Patient transits and fleet elements
            trucks = random.randint(0, 2)
            
        elif loc_type == "residential":
            # Balanced commuter profiles
            motorcycles = int(base_traffic * random.uniform(0.50, 0.65))
            cars = int(base_traffic * random.uniform(0.30, 0.45))
            buses = random.randint(1, 4)   # School/Chartered drops
            trucks = random.randint(1, 4) if (10 <= hour <= 17) else random.randint(0, 1) # Courier/Delivery

        elif loc_type == "mall":
            # Family vehicles and auto-rickshaws/cabs dominate
            cars = int(base_traffic * random.uniform(0.45, 0.60))
            motorcycles = int(base_traffic * random.uniform(0.35, 0.45))
            buses = random.randint(1, 5)
            # Commercial restocking happens late at night
            trucks = random.randint(2, 6) if (23 <= hour or hour <= 6) else random.randint(0, 1)

        vehicle_count = cars + motorcycles + buses + trucks

        # ---------------- 3. AQI / ENVIRONMENT CALCULATION ----------------
        raw_emission = (cars * 110) + (motorcycles * 45) + (buses * 650) + (trucks * 850)
        
        # Environmental ambient baseline
        ambient_baseline = 75 if loc_type in ["hospital", "mall"] else 45
        pollution = min(500, max(ambient_baseline, int((raw_emission / 130) + random.randint(10, 35))))

        # ---------------- 4. CONGESTION CALCULATION ----------------
        if loc_type == "college":
            congestion_score = min(100, int((vehicle_count / 1.8) + random.randint(5, 15))) if vehicle_count > 120 else min(100, int((vehicle_count / 2.5) + random.randint(0, 10)))
        elif loc_type == "hospital":
            congestion_score = min(100, int((vehicle_count / 1.9) + random.randint(5, 12)))
        elif loc_type == "residential":
            congestion_score = min(100, int((vehicle_count / 2.4) + random.randint(0, 8)))
        elif loc_type == "mall":
            divider = 1.5 if is_weekend else 2.2
            congestion_score = min(100, int((vehicle_count / divider) + random.randint(0, 15)))

        if vehicle_count < 8:
            congestion_score = random.randint(0, 5)

        # ---------------- APPEND DATAFRAME ROW (STRICT COLUMN ORDERING) ----------------
        all_rows.append({
            "date": current.strftime("%Y-%m-%d"),
            "month": month,
            "day_of_year": day_of_year,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "hour": hour,
            "minute": current.minute,
            "lat": coords["lat"],
            "lng": coords["lng"],
            "vehicle_count": vehicle_count,
            "cars": cars,
            "motorcycles": motorcycles,
            "buses": buses,
            "trucks": trucks,
            "pollution": pollution,
            "congestion_score": congestion_score
        })

# ---------------- SAVE AS FORMATTED CSV ----------------
df = pd.DataFrame(all_rows)

# Enforce strict column structural sequencing matching your request
exact_columns = [
    "date", "month", "day_of_year", "day_of_week", "is_weekend", "hour", "minute",
    "lat", "lng", "vehicle_count", "cars", "motorcycles", "buses", "trucks",
    "pollution", "congestion_score"
]
df = df[exact_columns]

os.makedirs("logs", exist_ok=True)
df.to_csv("logs/master_urban_traffic_logs.csv", index=False)

print("Formatted dataset successfully generated!")
print(f"File stored at: logs/master_urban_traffic_logs.csv")
print(f"Total Rows Compiled: {len(df)}")