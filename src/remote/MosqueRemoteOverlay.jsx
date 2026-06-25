// remote/MosqueRemoteOverlay.jsx
// Floating bottom-right overlay on the TV screen.
// Shows QR with a countdown ring. Collapses to green badge when connected.

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

const TOKEN_TTL_MS = 5 * 60 * 1000;

function CountdownRing({ timeLeft, size = 148 }) {
  const r = 68, stroke = 3;
  const circ = 2 * Math.PI * r;
  const progress = timeLeft / TOKEN_TTL_MS;
  const offset   = circ * (1 - progress);
  const color    = progress > 0.5 ? "#22c55e" : progress > 0.2 ? "#f59e0b" : "#ef4444";
  const mm = Math.floor(timeLeft / 60000);
  const ss = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}
        style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }} />
      </svg>
      <div style={{
        position: "absolute", bottom: 2, left: "50%",
        transform: "translateX(-50%)",
        fontSize: 10, fontWeight: 700, color,
        fontFamily: "monospace",
        background: "rgba(15,23,42,0.9)",
        padding: "1px 5px", borderRadius: 4,
      }}>
        {mm}:{String(ss).padStart(2, "0")}
      </div>
    </div>
  );
}

export function MosqueRemoteOverlay({ remoteUrl, timeLeft, connected, remoteName }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    if (!remoteUrl) return;
    QRCode.toDataURL(remoteUrl, {
      width: 120, margin: 1,
      color: { dark: "#0f172a", light: "#f8fafc" },
    }).then(setQrDataUrl);
  }, [remoteUrl]);

  if (!remoteUrl) return null;

  if (connected) {
    return (
      <div style={s.wrapper}>
        <div style={s.badge}>
          <span style={s.dot} />
          <span style={s.badgeText}>{remoteName || "Remote"} i lidhur</span>
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      <div style={s.panel}>
        <div style={s.header}>📱 Lidhu me Remote</div>
        <div style={s.ringBox}>
          <CountdownRing timeLeft={timeLeft} size={148} />
          {qrDataUrl && <img src={qrDataUrl} alt="QR" style={s.qr} />}
        </div>
        <div style={s.hint}>QR skadet çdo 5 minuta</div>
      </div>
    </div>
  );
}

const s = {
  wrapper: {
    position: "fixed", bottom: 24, right: 24, zIndex: 9999,
    fontFamily: "'Inter','Segoe UI',sans-serif",
  },
  panel: {
    background: "rgba(15,23,42,0.92)",
    backdropFilter: "blur(12px)",
    borderRadius: 16, padding: "16px 18px",
    color: "#f1f5f9",
    border: "1px solid rgba(255,255,255,0.1)",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  header: {
    fontSize: 12, fontWeight: 600,
    letterSpacing: "0.05em",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 12,
  },
  ringBox: {
    position: "relative", width: 148, height: 148,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  qr: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%, -55%)",
    width: 112, height: 112,
    borderRadius: 8, background: "#f8fafc",
    padding: 4, boxSizing: "border-box",
  },
  hint: {
    fontSize: 10, color: "rgba(255,255,255,0.3)",
    marginTop: 10, letterSpacing: "0.03em",
  },
  badge: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(15,23,42,0.85)",
    backdropFilter: "blur(8px)",
    borderRadius: 999, padding: "8px 16px",
    border: "1px solid rgba(34,197,94,0.3)",
  },
  dot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#22c55e", display: "inline-block",
    boxShadow: "0 0 8px #22c55e",
  },
  badgeText: { fontSize: 13, color: "#86efac", fontWeight: 600 },
};
