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

export function useMosqueRemote({ onCommand, baseUrl = window.location.origin }) {
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
    const guid = loadOrCreateGuid();
    guidRef.current = guid;
    localStorage.setItem("mosque_room_guid", guid);
    setRemoteUrl(null);

    function connect() {
      if (destroyed) return;

      // Peer id == prefixed guid, so the phone reaches us via the room guid.
      const peer = new Peer(`${PEER_PREFIX}${guid}`);
      peerRef.current = peer;

      peer.on("open", () => {
        if (destroyed) { peer.destroy(); return; }
        console.log("[MosqueRemote] peer open, guid:", guid);
        // Show QR now that the peer is registered with the broker.
        const { token, expiresAt } = loadOrCreateToken();
        tokenRef.current = token;
        setRemoteUrl(buildUrl(guid, token));
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
        console.warn("[MosqueRemote] peer error:", err?.type || err?.message);
        // "unavailable-id" means our id is briefly still held by the broker
        // after a reload; PeerJS will not auto-recover, so retry.
        if (!destroyed && err?.type === "unavailable-id") {
          setTimeout(connect, 2000);
        }
      });

      peer.on("disconnected", () => {
        if (destroyed) return;
        // Lost the signaling link to the broker — reconnect so new phones can
        // still find us. Existing data connections survive independently.
        try { peer.reconnect(); } catch { /* peer may be destroyed */ }
      });

      peer.on("close", () => {
        if (destroyed) return;
        authRef.current = false;
        connRef.current = null;
        setConnected(false);
        setRemoteName(null);
        setRemoteUrl(null);
        setTimeout(connect, 2000);
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
    }

    connect();

    return () => {
      destroyed = true;
      try { connRef.current?.close(); } catch { /* noop */ }
      try { peerRef.current?.destroy(); } catch { /* noop */ }
    };
  }, [buildUrl, onCommand]);

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
