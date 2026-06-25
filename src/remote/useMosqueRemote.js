// remote/useMosqueRemote.js  — TV-side hook
//
// Transport: WebRTC via PeerJS (uses the free public PeerJS broker for
// signaling only — actual TV↔phone data flows peer-to-peer). This works on a
// static host like Vercel because there is no relay server we must run.
//
// The TV registers its Peer under the room guid, so the phone can reach it
// simply by connecting to that guid. The QR URL already carries the guid as
// `room`, so nothing about the QR/auth flow changes.
//
// AUTH FLOW (unchanged):
//   Phone sends { type: "AUTH", payload: { token?, passcode? } }
//   TV replies AUTH_OK  — on valid token OR valid passcode
//   TV replies AUTH_FAIL — on invalid credentials, with canUsePasscode hint

import { useCallback, useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { hasPasscode, verifyPasscode } from "./passcodeUtils";

const TOKEN_TTL_MS = 5 * 60 * 1000;
const TOKEN_CHARS  = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// PeerJS rejects ids with characters outside [A-Za-z0-9_-], so the raw UUID
// (which contains dashes — allowed) is fine, but we prefix to avoid collisions
// with other apps on the shared public broker.
const PEER_PREFIX = "mosquetv-";

function genToken() {
  return Array.from({ length: 6 }, () =>
    TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)]
  ).join("");
}

function generateUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function loadOrCreateGuid() {
  let g = localStorage.getItem("mosque_room_guid");
  if (!g) { g = generateUUID(); localStorage.setItem("mosque_room_guid", g); }
  return g;
}

function loadOrCreateToken() {
  const raw = localStorage.getItem("mosque_room_token");
  if (raw) {
    const { token, expiresAt } = JSON.parse(raw);
    if (Date.now() < expiresAt) return { token, expiresAt };
  }
  const token = genToken();
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  localStorage.setItem("mosque_room_token", JSON.stringify({ token, expiresAt }));
  return { token, expiresAt };
}

export function useMosqueRemote({ onCommand, onConnect, baseUrl = window.location.origin }) {
  const [remoteUrl, setRemoteUrl]   = useState(null);
  const [timeLeft, setTimeLeft]     = useState(TOKEN_TTL_MS);
  const [connected, setConnected]   = useState(false);
  const [remoteName, setRemoteName] = useState(null);

  const peerRef      = useRef(null);
  const connRef      = useRef(null); // current authenticated phone DataConnection
  const tokenRef     = useRef(null);
  const guidRef      = useRef(null);
  const authRef      = useRef(false); // true while a phone is authenticated

  const buildUrl = useCallback(
    (guid, token) => `${baseUrl}/remote?room=${guid}&token=${token}`,
    [baseUrl]
  );

  // ── PeerJS host ──────────────────────────────────────────────────────────
  useEffect(() => {
    let destroyed = false;
    let currentGuid = loadOrCreateGuid();
    guidRef.current = currentGuid;
    localStorage.setItem("mosque_room_guid", currentGuid);
    setRemoteUrl(null);

    let retryCount = 0;
    const MAX_RETRIES = 5;

    function connect() {
      if (destroyed) return;

      currentGuid = loadOrCreateGuid();
      guidRef.current = currentGuid;
      
      // Peer id == prefixed guid, so the phone reaches us via the room guid.
      const peer = new Peer(`${PEER_PREFIX}${currentGuid}`);
      peerRef.current = peer;

      peer.on("open", () => {
        if (destroyed) { peer.destroy(); return; }
        retryCount = 0; // reset on success
        console.log("[MosqueRemote] peer open, guid:", currentGuid);
        // Show QR now that the peer is registered with the broker.
        const { token, expiresAt } = loadOrCreateToken();
        tokenRef.current = token;
        setRemoteUrl(buildUrl(currentGuid, token));
        setTimeLeft(Math.max(0, expiresAt - Date.now()));
      });

      peer.on("connection", (conn) => {
        if (destroyed) { conn.close(); return; }

        conn.on("data", async (data) => {
          if (destroyed || !data || typeof data !== "object") return;

          // Authenticated command
          if (data.type !== "AUTH") {
            if (authRef.current && connRef.current === conn) onCommand(data);
            return;
          }

          // AUTH attempt
          const { token: sentToken, passcode: sentPasscode } = data.payload ?? {};
          console.log("[MosqueRemote] AUTH — token match:", sentToken === tokenRef.current, "hasPasscode:", hasPasscode());

          if (sentToken && sentToken === tokenRef.current) {
            _acceptPhone(conn);
            return;
          }

          if (sentPasscode && hasPasscode()) {
            const ok = await verifyPasscode(sentPasscode);
            if (ok) { _acceptPhone(conn); return; }
            conn.send({ type: "AUTH_FAIL", payload: { reason: "Fjalëkalimi është i gabuar." } });
            return;
          }

          conn.send({
            type: "AUTH_FAIL",
            payload: { reason: "Token i skaduar.", canUsePasscode: hasPasscode() },
          });
        });

        conn.on("close", () => {
          if (connRef.current !== conn) return;
          connRef.current = null;
          authRef.current = false;
          setConnected(false);
          setRemoteName(null);
        });

        conn.on("error", () => {
          if (connRef.current !== conn) return;
          connRef.current = null;
          authRef.current = false;
          setConnected(false);
          setRemoteName(null);
        });
      });

      peer.on("error", (err) => {
        if (err?.type === "network") {
          // Broker is unreachable — don't spam reconnect, let the
          // "disconnected" handler deal with backoff.
          return;
        }
        console.warn("[MosqueRemote] peer error:", err?.type || err?.message);
        if (!destroyed && err?.type === "unavailable-id") {
          try { peer.destroy(); } catch { /* noop */ }
          localStorage.removeItem("mosque_room_guid");
          setTimeout(connect, 1500);
        }
      });

      peer.on("disconnected", () => {
        if (destroyed) return;
        retryCount++;
        if (retryCount > MAX_RETRIES) {
          console.warn("[MosqueRemote] broker unreachable after", MAX_RETRIES, "retries — will retry in 60s");
          // Long cooldown, then reset counter and try fresh
          setTimeout(() => {
            if (destroyed) return;
            retryCount = 0;
            try { peer.destroy(); } catch {}
            connect();
          }, 60000);
          return;
        }
        const delay = Math.min(5000 * Math.pow(2, retryCount - 1), 30000);
        setTimeout(() => {
          if (!destroyed && peer && !peer.destroyed) {
            try { peer.reconnect(); } catch { /* peer may be destroyed */ }
          }
        }, delay);
      });

      peer.on("close", () => {
        if (destroyed) return;
        authRef.current = false;
        connRef.current = null;
        setConnected(false);
        setRemoteName(null);
        setRemoteUrl(null);
        retryCount++;
        if (retryCount > MAX_RETRIES) {
          setTimeout(() => { if (!destroyed) { retryCount = 0; connect(); } }, 60000);
          return;
        }
        setTimeout(connect, Math.min(5000 * Math.pow(2, retryCount - 1), 30000));
      });
    }

    function _acceptPhone(conn) {
      // Replace any previous phone.
      if (connRef.current && connRef.current !== conn) {
        try { connRef.current.close(); } catch { /* already gone */ }
      }
      connRef.current = conn;
      authRef.current = true;
      setConnected(true);
      setRemoteName("Remote");
      conn.send({ type: "AUTH_OK" });
      // Let the app push initial state (e.g. full settings) to the new phone.
      onConnect?.((data) => { if (conn.open) conn.send(data); });
    }

    connect();

    return () => {
      destroyed = true;
      try { connRef.current?.close(); } catch { /* noop */ }
      const p = peerRef.current;
      if (p && !p.destroyed) {
        if (!p.open && !p.disconnected) {
          p.on("open", () => { try { p.destroy(); } catch {} });
          p.on("error", () => { try { p.destroy(); } catch {} });
        } else {
          try { p.destroy(); } catch {}
        }
      }
    };
  }, [buildUrl, onCommand, onConnect]);

  // ── Token countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    let rafId;
    function tick() {
      const raw = localStorage.getItem("mosque_room_token");
      if (raw) {
        const { expiresAt } = JSON.parse(raw);
        const remaining = expiresAt - Date.now();
        if (remaining <= 0) {
          if (!authRef.current) {
            const { token, expiresAt: newExp } = loadOrCreateToken();
            tokenRef.current = token;
            setRemoteUrl(buildUrl(guidRef.current, token));
            setTimeLeft(Math.max(0, newExp - Date.now()));
          }
        } else {
          setTimeLeft(remaining);
        }
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [buildUrl]);

  const sendToRemote = (data) => {
    if (authRef.current && connRef.current?.open) {
      connRef.current.send(data);
    }
  };

  return { remoteUrl, timeLeft, connected, remoteName, sendToRemote };
}
