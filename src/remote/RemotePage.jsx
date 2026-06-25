// remote/RemotePage.jsx  — Phone-side remote control
// Route: /remote
//
// Transport: WebRTC via PeerJS. The phone connects directly to the TV's peer
// (id == "mosquetv-" + room guid) using the free public PeerJS broker for
// signaling only. No relay server is hosted, so this works on Vercel.
//
// Phases:
//   no_params  → no room= in URL (user didn't scan QR)
//   connecting → peer connecting + AUTH in flight
//   ask_passcode → token expired; prompt for passcode
//   connected  → AUTH_OK received; show control panel
//   error      → connection or auth failure

import React, { useCallback, useEffect, useRef, useState } from "react";
import Peer from "peerjs";

// Must match PEER_PREFIX in useMosqueRemote.js (TV side).
const PEER_PREFIX = "mosquetv-";

const COMMANDS = [
  { type: "SHOW_PRAYER_TIMES",  label: "🕌  Oraret e Namazit",  color: "#1d4ed8" },
  { type: "SHOW_QURAN",         label: "📖  Kurani",             color: "#6d28d9" },
  { type: "SHOW_HADITH",        label: "✨  Hadithi",            color: "#0e7490" },
  { type: "SHOW_ANNOUNCEMENTS", label: "📢  Njoftime",           color: "#c2410c" },
  { type: "SHOW_CLOCK",         label: "🕐  Ora & Data",         color: "#374151" },
  { type: "TOGGLE_FULLSCREEN",  label: "⛶   Ekran i plotë",     color: "#374151" },
  { type: "RELOAD_PAGE",        label: "↺   Rifresko",           color: "#374151" },
];

function AnnouncementSender({ onSend }) {
  const [text, setText] = useState("");
  return (
    <div style={s.annoBox}>
      <div style={s.sectionTitle}>Dërgo Njoftim</div>
      <textarea style={s.textarea} placeholder="Shkruaj njoftimin këtu…"
        rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      <button
        style={{ ...s.btn, background: text.trim() ? "#c2410c" : "#1e293b", marginTop: 8 }}
        onClick={() => { if (text.trim()) { onSend({ type: "ANNOUNCEMENT_TEXT", payload: { text: text.trim() } }); setText(""); } }}
        disabled={!text.trim()}>
        Dërgo →
      </button>
    </div>
  );
}

function PasscodeForm({ onSubmit, loading, error }) {
  const [value, setValue] = useState("");
  const [show, setShow]   = useState(false);
  return (
    <div>
      <div style={s.fieldLabel}>Fjalëkalimi i Remote</div>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          style={{ ...s.input, paddingRight: 44 }}
          placeholder="Fjalëkalimi…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && value && onSubmit(value)}
          autoComplete="current-password"
        />
        <button style={s.eyeBtn} onClick={() => setShow(!show)} tabIndex={-1}>
          {show ? "🙈" : "👁"}
        </button>
      </div>
      {error && <div style={s.errorSmall}>{error}</div>}
      <button
        style={{ ...s.btn, background: value ? "#1d4ed8" : "#1e293b", marginTop: 12 }}
        onClick={() => value && onSubmit(value)}
        disabled={!value || loading}
      >
        {loading ? "Duke verifikuar…" : "Lidhu →"}
      </button>
    </div>
  );
}

export default function RemotePage() {
  const [phase, setPhase]                 = useState("init");
  const [errorMsg, setErrorMsg]           = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [lastSent, setLastSent]           = useState(null);
  const [loading, setLoading]             = useState(false);

  const peerRef     = useRef(null);
  const connRef     = useRef(null);
  const guidRef     = useRef(null);
  const tokenRef    = useRef(null);
  const passcodeRef = useRef(null); // tracks whether last AUTH attempt used a passcode

  // Wire a fresh DataConnection's handlers. `firstAttempt` controls whether a
  // token AUTH is auto-sent on open (true) vs. waiting for a passcode (false).
  const wireConnection = useCallback((conn, { firstAttempt }) => {
    connRef.current = conn;

    const timeoutId = setTimeout(() => {
      if (conn.open) return;
      try { conn.close(); } catch { /* noop */ }
      setPhase((prev) => (prev === "connecting" ? "error" : prev));
      setErrorMsg("Lidhja nuk u vendos. Sigurohu që TV-ja është aktive dhe ka internet.");
    }, 12000);

    conn.on("open", () => {
      clearTimeout(timeoutId);
      console.log("[Remote] peer connection open — sending AUTH");
      if (firstAttempt) {
        passcodeRef.current = null;
        conn.send({ type: "AUTH", payload: { token: tokenRef.current, passcode: null } });
      }
    });

    conn.on("data", (data) => {
      if (!data || typeof data !== "object") return;
      console.log("[Remote] received:", data?.type, data?.payload);

      if (data.type === "AUTH_OK") {
        setPhase("connected");
        setPasscodeError("");
        setLoading(false);
      } else if (data.type === "AUTH_FAIL") {
        setLoading(false);
        const canUsePasscode = data.payload?.canUsePasscode;
        if (passcodeRef.current) {
          setPasscodeError(data.payload?.reason || "Fjalëkalimi është i gabuar.");
          setPhase("ask_passcode");
        } else if (canUsePasscode) {
          setPhase("ask_passcode");
        } else {
          setPhase("error");
          setErrorMsg("QR kodi ka skaduar. Skanoni QR kodin e ri nga ekrani i xhamisë.");
        }
      }
    });

    conn.on("close", () => {
      clearTimeout(timeoutId);
      setPhase((prev) => {
        if (prev === "connected") {
          setErrorMsg("Lidhja u ndërpre. Skanoni QR kodin përsëri.");
          return "error";
        }
        return prev;
      });
    });

    conn.on("error", () => {
      clearTimeout(timeoutId);
      setPhase((prev) => {
        if (prev === "connecting") {
          setErrorMsg("Nuk u arrit TV-ja. A është TV aktiv dhe i lidhur me internet?");
          return "error";
        }
        return prev;
      });
    });
  }, []);

  // ── On mount: read URL params + open peer connection ─────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const guid   = params.get("room");
    const token  = params.get("token");

    if (!guid) { setPhase("no_params"); return; }

    guidRef.current  = guid;
    tokenRef.current = token;

    let destroyed = false;
    setPhase("connecting");

    const peer = new Peer();
    peerRef.current = peer;

    peer.on("open", () => {
      if (destroyed) { peer.destroy(); return; }
      const conn = peer.connect(`${PEER_PREFIX}${guid}`, { reliable: true });
      wireConnection(conn, { firstAttempt: true });
    });

    peer.on("error", (err) => {
      if (destroyed) return;
      const code = err?.type || err?.message || "unknown";
      console.warn("[Remote] peer error:", code);
      // "peer-unavailable" → the TV isn't registered / not online.
      setPhase((prev) => (prev === "connected" ? prev : "error"));
      setErrorMsg(
        (err?.type === "peer-unavailable"
          ? "TV-ja nuk u gjet. Sigurohu që ekrani i xhamisë është ndezur."
          : "Lidhja dështoi. Provo përsëri ose skano QR kodin e ri.") +
          `  [${code}]`
      );
    });

    return () => {
      destroyed = true;
      try { connRef.current?.close(); } catch { /* noop */ }
      try { peerRef.current?.destroy(); } catch { /* noop */ }
    };
  }, [wireConnection]);

  // ── Passcode submit ────────────────────────────────────────────────────────
  function handlePasscode(value) {
    setLoading(true);
    setPasscodeError("");
    passcodeRef.current = value;
    if (connRef.current?.open) {
      connRef.current.send({ type: "AUTH", payload: { token: null, passcode: value } });
    }
  }

  // ── Send command ───────────────────────────────────────────────────────────
  const send = useCallback((cmd) => {
    if (connRef.current?.open) {
      connRef.current.send(cmd);
      setLastSent(cmd.type);
      setTimeout(() => setLastSent(null), 1500);
    }
  }, []);

  // ── Retry ─────────────────────────────────────────────────────────────────
  function retry() {
    try { connRef.current?.close(); } catch { /* noop */ }
    setErrorMsg("");
    setPhase("connecting");

    const peer = peerRef.current;
    if (peer && !peer.destroyed && peer.open) {
      const conn = peer.connect(`${PEER_PREFIX}${guidRef.current}`, { reliable: true });
      wireConnection(conn, { firstAttempt: true });
      return;
    }

    // Peer is gone (e.g. broker dropped us) — recreate it.
    try { peer?.destroy(); } catch { /* noop */ }
    const fresh = new Peer();
    peerRef.current = fresh;
    fresh.on("open", () => {
      const conn = fresh.connect(`${PEER_PREFIX}${guidRef.current}`, { reliable: true });
      wireConnection(conn, { firstAttempt: true });
    });
    fresh.on("error", () => {
      setPhase((prev) => (prev === "connected" ? prev : "error"));
      setErrorMsg("TV-ja nuk u gjet. Sigurohu që ekrani i xhamisë është ndezur.");
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <span style={s.logo}>🕌</span>
          <div>
            <div style={s.title}>Telekomandë</div>
            <div style={s.subtitle}>MosqueScreenTV</div>
          </div>
          {phase === "connected" && (
            <div style={s.connectedPill}>
              <span style={s.dot} /> Lidhur
            </div>
          )}
        </div>

        {/* No params */}
        {phase === "no_params" && (
          <div style={s.center}>
            <div style={s.bigIcon}>📷</div>
            <div style={s.centerTitle}>Skanoni QR Kodin</div>
            <div style={s.centerText}>
              Hapni kamerën dhe skanoni QR kodin e shfaqur në ekranin e xhamisë.
            </div>
          </div>
        )}

        {/* Connecting */}
        {phase === "connecting" && (
          <div style={s.center}>
            <div style={s.spinner} />
            <div style={s.centerTitle}>Duke u lidhur…</div>
            <div style={s.centerText}>Po vendosim lidhjen dhe po verifikojmë…</div>
          </div>
        )}

        {/* Token expired → ask passcode */}
        {phase === "ask_passcode" && (
          <div>
            <div style={s.warningBox}>⏱ QR kodi ka skaduar — hyni me fjalëkalim</div>
            <PasscodeForm onSubmit={handlePasscode} loading={loading} error={passcodeError} />
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div style={s.center}>
            <div style={s.bigIcon}>⚠️</div>
            <div style={s.errorBanner}>{errorMsg}</div>
            {guidRef.current && (
              <button
                style={{ ...s.btn, background: "#1d4ed8", marginTop: 4, marginBottom: 8 }}
                onClick={retry}
              >
                ↺ Provo Përsëri
              </button>
            )}
            <div style={s.centerText}>
              Ose skanoni QR kodin e ri nga ekrani i xhamisë.
            </div>
          </div>
        )}

        {/* Connected — control panel */}
        {phase === "connected" && (
          <div>
            <div style={s.sectionTitle}>Përmbajtja</div>
            <div style={s.grid}>
              {COMMANDS.map((cmd) => (
                <button
                  key={cmd.type}
                  style={{
                    ...s.cmdBtn,
                    background: lastSent === cmd.type ? "#22c55e" : cmd.color,
                    transform: lastSent === cmd.type ? "scale(0.95)" : "scale(1)",
                  }}
                  onClick={() => send(cmd)}
                >
                  {lastSent === cmd.type ? "✓ Dërguar" : cmd.label}
                </button>
              ))}
            </div>
            <AnnouncementSender onSend={send} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh", background: "#0f172a",
    display: "flex", alignItems: "flex-start", justifyContent: "center",
    padding: "24px 16px 48px",
    fontFamily: "'Inter','Segoe UI',sans-serif",
  },
  card: {
    width: "100%", maxWidth: 420,
    background: "#1e293b", borderRadius: 16, padding: 24,
    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
  },
  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 28 },
  logo: { fontSize: 32 },
  title: { fontSize: 20, fontWeight: 700, color: "#f1f5f9" },
  subtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  connectedPill: {
    marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: 999, padding: "5px 12px", color: "#86efac",
    fontSize: 12, fontWeight: 600,
  },
  dot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#22c55e", display: "inline-block",
    boxShadow: "0 0 6px #22c55e",
  },
  center: { textAlign: "center", padding: "16px 0 8px" },
  bigIcon: { fontSize: 48, marginBottom: 16 },
  centerTitle: { fontSize: 17, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 },
  centerText: { fontSize: 14, color: "#64748b", lineHeight: 1.6, maxWidth: 300, margin: "0 auto" },
  spinner: {
    width: 40, height: 40,
    border: "3px solid #1e3a5f", borderTop: "3px solid #3b82f6",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
    margin: "0 auto 20px",
  },
  errorBanner: {
    background: "#450a0a", color: "#fca5a5",
    borderRadius: 10, padding: "12px 16px",
    fontSize: 14, margin: "0 auto 16px",
    lineHeight: 1.5, maxWidth: 320,
  },
  warningBox: {
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.3)",
    color: "#fcd34d", borderRadius: 10, padding: "10px 14px",
    fontSize: 13, marginBottom: 16,
  },
  fieldLabel: { fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 500 },
  input: {
    width: "100%", background: "#0f172a",
    border: "1px solid #334155", borderRadius: 10,
    padding: "12px 14px", color: "#f1f5f9", fontSize: 16,
    outline: "none", boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute", right: 12, top: "50%",
    transform: "translateY(-50%)",
    background: "none", border: "none",
    fontSize: 16, cursor: "pointer",
    color: "rgba(255,255,255,0.4)",
  },
  errorSmall: { color: "#fca5a5", fontSize: 12, marginTop: 6 },
  btn: {
    width: "100%", padding: "13px", border: "none",
    borderRadius: 10, color: "#fff", fontSize: 15,
    fontWeight: 600, cursor: "pointer",
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 600,
    letterSpacing: "0.1em", textTransform: "uppercase",
    color: "#64748b", marginBottom: 12,
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 },
  cmdBtn: {
    padding: "14px 10px", border: "none", borderRadius: 10,
    color: "#fff", fontSize: 13, fontWeight: 600,
    cursor: "pointer", transition: "background 0.2s, transform 0.15s",
    textAlign: "center", lineHeight: 1.4,
  },
  annoBox: { background: "#0f172a", borderRadius: 12, padding: 16, border: "1px solid #1e3a5f" },
  textarea: {
    width: "100%", background: "#1e293b",
    border: "1px solid #334155", borderRadius: 8,
    padding: "10px 12px", color: "#f1f5f9", fontSize: 14,
    outline: "none", resize: "vertical",
    boxSizing: "border-box", fontFamily: "inherit",
  },
};
