import "./TrafficCard.css";

const LEVEL_CONFIG = {
  LOW:    { color: "#00D4AA", bg: "rgba(0,212,170,0.1)",  border: "rgba(0,212,170,0.25)",  label: "Low Traffic" },
  MEDIUM: { color: "#FF6B35", bg: "rgba(255,107,53,0.1)", border: "rgba(255,107,53,0.25)", label: "Moderate Congestion" },
  HIGH:   { color: "#FF4444", bg: "rgba(255,68,68,0.1)",  border: "rgba(255,68,68,0.25)",  label: "Heavy Congestion" },
};

export default function TrafficCard({ result }) {
  if (!result) {
    return (
      <div className="traffic-card traffic-card--empty">
        <div className="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <div className="empty-text">No analysis yet</div>
        <div className="empty-sub">Upload an image and click Analyze</div>
      </div>
    );
  }

  const { vehicle_count, traffic_level, congestion_score, lat, lng } = result;
  const cfg = LEVEL_CONFIG[traffic_level] || LEVEL_CONFIG.MEDIUM;

  return (
    <div className="traffic-card">
      <div className="tc-top">
        <div>
          <div className="tc-count">{vehicle_count}</div>
          <div className="tc-count-label">Vehicles Detected</div>
        </div>
        <span className="level-badge" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          ● {cfg.label}
        </span>
      </div>

      <div className="congestion-section">
        <div className="congestion-header">
          <span className="metric-name">CONGESTION SCORE</span>
          <span className="congestion-val" style={{ color: cfg.color }}>{congestion_score}/100</span>
        </div>
        <div className="congestion-track">
          <div
            className="congestion-fill"
            style={{ width: `${congestion_score}%`, background: cfg.color }}
          />
        </div>
        <div className="congestion-scale">
          <span>FREE FLOW</span>
          <span>CONGESTED</span>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric-name">COORDINATES</div>
        <div className="metric-coords">{lat?.toFixed(4)}°N · {lng?.toFixed(4)}°E</div>
      </div>
    </div>
  );
}