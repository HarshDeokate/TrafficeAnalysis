import { useEffect, useState } from "react";
import "./SignalTimer.css";

const LEVEL_COLOR = {
  LOW: "#00D4AA",
  MEDIUM: "#FF6B35",
  HIGH: "#FF4444",
};

const PRIORITY_ICON = {
  NORMAL: "🟢",
  MODERATE: "🟡",
  HIGH: "🔴",
};

export default function SignalTimer({ recommendation, level }) {
  const { green_duration, priority, action, vehicles_per_cycle } = recommendation;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const color = LEVEL_COLOR[level] || "#FF6B35";
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = running ? ((green_duration - elapsed) / green_duration) * circumference : circumference;

  useEffect(() => {
    setElapsed(0);
    setRunning(false);
  }, [green_duration]);

  useEffect(() => {
    if (!running) return;
    if (elapsed >= green_duration) { setRunning(false); return; }
    const t = setTimeout(() => setElapsed((e) => e + 1), 1000);
    return () => clearTimeout(t);
  }, [running, elapsed, green_duration]);

  const handleToggle = () => {
    if (elapsed >= green_duration) setElapsed(0);
    setRunning((r) => !r);
  };

  const remaining = green_duration - elapsed;

  return (
    <div className="signal-card">
      <div className="signal-left">
        <div className="signal-circle-wrap">
          <svg width="92" height="92" viewBox="0 0 92 92">
            <circle cx="46" cy="46" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
            <circle
              cx="46" cy="46" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              transform="rotate(-90 46 46)"
              style={{ transition: "stroke-dashoffset 0.9s linear" }}
            />
          </svg>
          <div className="signal-circle-inner">
            <div className="signal-seconds" style={{ color }}>{running ? remaining : green_duration}</div>
            <div className="signal-sec-label">SEC</div>
          </div>
        </div>
        <button className="signal-btn" onClick={handleToggle} style={{ borderColor: color, color }}>
          {running ? "⏸ Pause" : elapsed > 0 ? "↺ Reset" : "▶ Simulate"}
        </button>
      </div>

      <div className="signal-right">
        <div className="signal-priority">
          <span>{PRIORITY_ICON[priority]}</span>
          <span className="signal-priority-text" style={{ color }}>{priority} PRIORITY</span>
        </div>
        <div className="signal-action">{action}</div>
        <div className="signal-stats">
          <div className="signal-stat">
            <div className="signal-stat-val">{green_duration}s</div>
            <div className="signal-stat-name">GREEN DURATION</div>
          </div>
          <div className="signal-stat">
            <div className="signal-stat-val">{vehicles_per_cycle}</div>
            <div className="signal-stat-name">VEHICLES / CYCLE</div>
          </div>
          <div className="signal-stat">
            <div className="signal-stat-val">{Math.round(vehicles_per_cycle / (green_duration / 60))}/min</div>
            <div className="signal-stat-name">THROUGHPUT</div>
          </div>
        </div>
      </div>
    </div>
  );
}