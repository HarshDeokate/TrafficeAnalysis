import "./AlertBanner.css";

export default function AlertBanner({ message, sub, onClose }) {
  return (
    <div className="alert-banner">
      <div className="alert-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div className="alert-text">
        <div className="alert-message">{message}</div>
        <div className="alert-sub">{sub}</div>
      </div>
      <button className="alert-close" onClick={onClose}>✕</button>
    </div>
  );
}