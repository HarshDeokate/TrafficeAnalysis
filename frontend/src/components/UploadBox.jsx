import { useState, useRef } from "react";
import "./UploadBox.css";

export default function UploadBox({ onFileSelect }) {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    onFileSelect(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div
      className={`upload-zone ${dragging ? "upload-zone--drag" : ""} ${preview ? "upload-zone--filled" : ""}`}
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {preview ? (
        <div className="upload-preview">
          <img src={preview} alt="Uploaded traffic" className="preview-img" />
          <div className="preview-overlay">
            <span className="preview-change">Click to change</span>
          </div>
        </div>
      ) : (
        <>
          <div className="upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </div>
          <div className="upload-title">{dragging ? "Drop it!" : "Drop traffic image here"}</div>
          <div className="upload-sub">PNG, JPG, or JPEG</div>
          <div className="upload-hint">or click to browse files</div>
        </>
      )}
    </div>
  );
}