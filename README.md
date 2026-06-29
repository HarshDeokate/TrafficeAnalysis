# Traffic Analysis System

A full-stack traffic detection web app using a Faster R-CNN model on the backend and a React + Google Maps frontend.

## Project Structure

```
BE_PROJECT/
├── backend/
│   ├── main.py
│   ├── model.pth        # not committed (see .gitignore)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── MapView.jsx / .css
    │   │   ├── TrafficCard.jsx / .css
    │   │   └── UploadBox.jsx / .css
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    ├── .env              # not committed (see .gitignore)
    ├── .env.example      # committed — shows required vars
    └── package.json
```

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
Runs on `http://localhost:8000`

### Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env and paste your Google Maps API key
npm install
npm run dev
```
Runs on `http://localhost:5173`

## Environment Variables

Create `frontend/.env` from `frontend/.env.example`:

```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

> The `.env` file is gitignored and will never be pushed to GitHub.

## Model

The `model.pth` file is excluded from git due to its size.  
Download it separately and place it in the `backend/` folder.


Emission Factors - 
    "car": 120,
    "motorcycle": 50,
    "bus": 800,
    "truck": 1000

Random forest :
    aqi - 0.9973
    cong - 0.9754

LSTM :
    aqi - 0.0833
    