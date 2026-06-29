import "./LiveStatusCard.css";

const getAQILevel = (aqi) => {
  if (aqi <= 50)
    return { label: "Good", color: "#00D4AA" };

  if (aqi <= 100)
    return { label: "Moderate", color: "#F9C74F" };

  if (aqi <= 150)
    return { label: "Unhealthy (SG)", color: "#FF9800" };

  if (aqi <= 200)
    return { label: "Unhealthy", color: "#F44336" };

  return { label: "Hazardous", color: "#8E24AA" };
};

export default function LiveStatusCard({
  congestion,
  trafficLevel,
  aqi,
  trend,
}) {
  const air = getAQILevel(aqi);
  const trendIcon =
    trend?.toLowerCase().includes("increasing")
        ? "📈"
        : trend?.toLowerCase().includes("decreasing")
        ? "📉"
        : "➡️";

  return (
    <div className="status-card">

      <h3>🚦 Live Prediction</h3>

      <div
        className="aqi-chip"
        style={{background:air.color}}
        >
        🌿 AQI {aqi}
      </div>

      <div
            className="traffic-chip"
            style={{
                background:
                    trafficLevel === "HIGH"
                        ? "#FF4444"
                        : trafficLevel === "MEDIUM"
                        ? "#FF9800"
                        : "#00D4AA"
            }}
        >
            🚦 {trafficLevel}
        </div>

      <div className="status-section">

        <div className="status-title">
          🚦 Traffic Congestion
        </div>


        <div className="progress-bg">
          <div
            className="progress-fill traffic"
            style={{ width: `${congestion}%` }}
          />
        </div>

        <div className="status-footer">
          <span
            style={{
                color:
                    trafficLevel === "HIGH"
                        ? "#FF4444"
                        : trafficLevel === "MEDIUM"
                        ? "#FF9800"
                        : "#00D4AA",
                fontWeight: 700
            }}
        >
            {trafficLevel}
        </span>
          <span>{Math.round(congestion)}%</span>
        </div>

      </div>

      <div className="status-section">

        <div className="status-title">
          🌿 Air Quality
        </div>

        <div className="progress-bg">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(aqi,300)/3}%`,
              background: air.color
            }}
          />
        </div>

        <div className="status-footer">
          <span>{air.label}</span>
          <span>{aqi}</span>
        </div>

      </div>

        <div className="trend">
            {trendIcon} {trend}
        </div>

        <div className="updated">
            Updated {new Date().toLocaleTimeString()}
        </div>

    </div>
  );
}