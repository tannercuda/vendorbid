"use client";

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 50,
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      onMouseDown={onClose}
    >
      <div
        className="card"
        style={{ width: "min(920px, 100%)", margin: 0 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2>{title}</h2>
            <div className="hint">Click outside to close.</div>
          </div>
          <button className="btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="hr"></div>
        {children}
      </div>
    </div>
  );
}
