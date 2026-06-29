import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import TrafficCard from "../components/TrafficCard";
import AlertBanner from "../components/AlertBanner";
import LiveStatusCard from "../components/LiveStatusCard";
import "../styles/HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locationLoading, setLocationLoading] = useState(true);
  const [forecast, setForecast] = useState(null);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alert, setAlert] = useState(null);

  // Load location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude.toFixed(6);
        const longitude = pos.coords.longitude.toFixed(6);
        setLat(latitude);
        setLng(longitude);
        setLocationLoading(false);
      },
      () => {
        console.warn("Geolocation unavailable");
        setLat("18.9388");
        setLng("72.8257");
        setLocationLoading(false);
      }
    );
  }, []);

  // Load forecast
  useEffect(() => {
    if (locationLoading || !lat || !lng) return;

    const fetchForecast = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/forecast?lat=${lat}&lng=${lng}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail);
        setForecast(data.forecast);
      } catch (err) {
        console.error("Forecast error:", err);
      }
    };


    const timeout = setTimeout(fetchForecast, 400);
    return () => clearTimeout(timeout);
  }, [lat, lng, locationLoading]);

  // Auto-refresh forecast every minute
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!lat || !lng) return;
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/forecast?lat=${lat}&lng=${lng}`
        );
        const data = await res.json();
        if (res.ok) setForecast(data.forecast);
      } catch (err) {
        console.error("Auto-refresh error:", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [lat, lng]);

  // Check for congestion alert
  const checkCongestionAlert = (newLogs) => {
    if (newLogs.length >= 3) {
      const recent = newLogs.slice(0, 3);
      if (recent.every((l) => l.level === "HIGH")) {
        setAlert({
          message: "⚠️ High Traffic Alert!",
          sub: "Congestion detected in 3 consecutive readings",
        });
      } else {
        setAlert(null);
      }
    }
  };

  // Receive result from analysis page via state
  useEffect(() => {
    const savedResult = sessionStorage.getItem("analysisResult");
    if (savedResult) {
      const data = JSON.parse(savedResult);
      setResult(data);

      const now = new Date();
      const time = now.toTimeString().slice(0, 8);
      const newEntry = {
        time,
        count: Number(data?.vehicle_count || 0),
        level: data?.traffic_level
          ? data.traffic_level.toUpperCase()
          : "MEDIUM",
        lat: Number(data?.lat || 0),
        lng: Number(data?.lng || 0),
        score: Number(data?.congestion_score || 0),
      };

      setLogs((prev) => {
        const updated = [newEntry, ...prev].slice(0, 100);
        checkCongestionAlert(updated);
        return updated;
      });

      sessionStorage.removeItem("analysisResult");
    }
  }, []);

  const handleExport = () => {
    if (logs.length === 0) return;

    const header =
      "Time,Latitude,Longitude,Vehicle Count,Traffic Level,Congestion Score\n";
    const rows = logs.map(
      (l) => `${l.time},${l.lat},${l.lng},${l.count},${l.level},${l.score}`
    );
    const csv = header + rows.join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traffic_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (locationLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <div className="spinner-large" />
          <h2>Loading Location...</h2>
          <p>Initializing smart traffic system</p>
        </div>
      </div>
    );
  }

  const trafficLevel = result?.traffic_level
    ? result.traffic_level.toUpperCase()
    : forecast
    ? forecast.predicted_congestion >= 70
        ? "HIGH"
        : forecast.predicted_congestion >= 40
        ? "MEDIUM"
        : "LOW"
    : "MEDIUM";


  return (
    <div className="home-page">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">🚦</div>
          <div>
            <div className="logo-text">AI Traffic Analyzer</div>
            <div className="logo-sub">
              Smart Traffic & Pollution Monitoring
            </div>
          </div>
        </div>
        <div className="header-right">
          <button
            className="nav-btn"
            onClick={() => navigate("/analyze")}
            title="Upload and analyze traffic image"
          >
            📸 Analyze Traffic
          </button>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={logs.length === 0}
            title="Export collected data"
          >
            📥 Export Report
          </button>
        </div>
      </header>

      {/* Alert */}
      {alert && (
        <AlertBanner
          message={alert.message}
          sub={alert.sub}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Main Map View */}
      <div className="map-main">
        <MapView lat={parseFloat(lat)} lng={parseFloat(lng)} logs={logs} trafficLevel={trafficLevel} onLocationChange={(newLat, newLng) => {
            setLat(newLat.toFixed(6));
            setLng(newLng.toFixed(6));
        }}/>

        {/* Prediction Card Overlay */}
        <div className="prediction-overlay">
          {result ? (
            <LiveStatusCard
                congestion={result.congestion_score}
                trafficLevel={result.traffic_level}
                aqi={forecast?.predicted_aqi ?? 0}
                trend={forecast?.trend ?? "Stable"}
            />
          ) : forecast ? (
            <LiveStatusCard
                congestion={forecast.predicted_congestion}
                trafficLevel={trafficLevel}
                aqi={forecast.predicted_aqi}
                trend={ forecast.trend}
            />
            
          ) : null}
        </div>
      </div>
    </div>
  );
}
