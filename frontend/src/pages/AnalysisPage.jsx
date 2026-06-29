import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UploadBox from "../components/UploadBox";
import TrafficCard from "../components/TrafficCard";
import SignalTimer from "../components/SignalTimer";
import "../styles/AnalysisPage.css";

export default function AnalysisPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [result, setResult] = useState(null);
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

  const handleAnalyze = async () => {
    if (!file) {
      setAlert({
        message: "❌ Please upload an image",
        type: "error",
      });
      return;
    }

    if (!lat || !lng) {
      setAlert({
        message: "❌ Location not loaded yet",
        type: "error",
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/predict?lat=${lat}&lng=${lng}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setAlert({
          message: `❌ Error: ${data.detail || "Analysis failed"}`,
          type: "error",
        });
        setLoading(false);
        return;
      }

      setResult(data);
      setAlert({
        message: "✅ Analysis complete!",
        type: "success",
      });
    } catch (err) {
      console.error(err);
      setAlert({
        message: "❌ Backend connection failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnMap = () => {
    if (result) {
      // Store result in session storage to pass to home page
      sessionStorage.setItem("analysisResult", JSON.stringify(result));
      navigate("/");
    }
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

  return (
    <div className="analysis-page">
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
            onClick={() => navigate("/")}
            title="Back to home"
          >
            🗺️ View Map
          </button>
        </div>
      </header>

      {/* Alert */}
      {alert && (
        <div className={`alert-message alert-${alert.type}`}>
          <span>{alert.message}</span>
          <button
            className="alert-close"
            onClick={() => setAlert(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="analysis-main">
        {!result ? (
          <div className="upload-section">
            <div className="upload-container">
              <h2>Analyze Traffic Image</h2>
              <p>Upload a traffic image to get real-time analysis</p>

              {/* Upload Box */}
              <div className="upload-wrapper">
                <UploadBox onFileSelect={setFile} />
              </div>

              {/* Location Controls */}
              <div className="location-section">
                <h3>Location Coordinates</h3>
                <div className="coords-grid">
                  <div className="field-group">
                    <label className="field-label">Latitude</label>
                    <input
                      className="field-input"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      type="number"
                      step="0.0001"
                      min="-90"
                      max="90"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Longitude</label>
                    <input
                      className="field-input"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      type="number"
                      step="0.0001"
                      min="-180"
                      max="180"
                    />
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <button
                className={`analyze-btn ${loading ? "analyze-btn--loading" : ""}`}
                onClick={handleAnalyze}
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    🚀 Analyze Traffic
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="results-section">
            <button className="back-btn" onClick={() => setResult(null)}>
              ← Analyze Another Image
            </button>

            <div className="results-container">
              {/* Traffic Summary */}
              <div className="result-group">
                <h3>Traffic Summary</h3>
                <TrafficCard result={result} />
              </div>

              {/* Vehicle Breakdown */}
              <div className="result-group">
                <h3>Vehicle Breakdown</h3>
                <div className="vehicle-grid">
                  <div className="vehicle-item">
                    🚗 Cars<span>{result.vehicle_breakdown.car}</span>
                  </div>
                  <div className="vehicle-item">
                    🏍 Bikes<span>{result.vehicle_breakdown.motorcycle}</span>
                  </div>
                  <div className="vehicle-item">
                    🚌 Buses<span>{result.vehicle_breakdown.bus}</span>
                  </div>
                  <div className="vehicle-item">
                    🚛 Trucks<span>{result.vehicle_breakdown.truck}</span>
                  </div>
                </div>
              </div>

              {/* Pollution */}
              <div className="result-group">
                <h3>Pollution Estimation</h3>
                <div className="pollution-card">
                  <div className="pollution-value">
                    {result.estimated_pollution.co2_estimate}
                  </div>
                  <div className="pollution-unit">g/km CO₂ Estimate</div>
                </div>
              </div>

              {/* Prediction */}
              {result?.prediction && (
                <div className="result-group">
                  <h3>Smart Forecast Prediction</h3>
                  <div className="prediction-grid">
                    <div className="prediction-item">
                      <div className="prediction-label">Predicted AQI</div>
                      <div className="prediction-value">
                        {result.prediction.predicted_aqi}
                      </div>
                    </div>
                    <div className="prediction-item">
                      <div className="prediction-label">Future Congestion</div>
                      <div className="prediction-value">
                        {result.prediction.predicted_congestion}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Signal Recommendation */}
              <div className="result-group">
                <h3>Signal Recommendation</h3>
                <SignalTimer
                  recommendation={result.signal_recommendation}
                  level={result.traffic_level}
                />
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button className="btn-primary" onClick={handleViewOnMap}>
                  📍 View on Map
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setResult(null)}
                >
                  📸 Analyze Another
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
