
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
const TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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
  const [remoteUrl, setRemoteUrl] = useState(null);
  const [connected, setConnected] = useState(false);
  const [remoteName, setRemoteName] = useState(null);

  const peerRef = useRef(null);
  const connRef = useRef(null); // current authenticated phone DataConnection
  const tokenRef = useRef(null);
  const guidRef = useRef(null);
  const authRef = useRef(false); // true while a phone is authenticated
  const onCommandRef = useRef(onCommand);
  const onConnectRef = useRef(onConnect);

  useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);

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

    // Initial token setup
    const { token } = loadOrCreateToken();
    tokenRef.current = token;
    setRemoteUrl(buildUrl(currentGuid, token));

    let retryCount = 0;
    const MAX_RETRIES = 5;
    let idRetryCount = 0;
    const MAX_ID_RETRIES = 4;
    let longCycleCount = 0;
    const MAX_LONG_CYCLE_DELAY = 300000; // 5 min ceiling

    // +/-20% jitter so many TVs sharing the public broker don't all retry
    // in lockstep and re-trigger the same rate limit together.
    function withJitter(ms) {
      const jitter = ms * 0.2;
      return Math.round(ms + (Math.random() * 2 - 1) * jitter);
    }

    function longCycleDelay() {
      const delay = Math.min(60000 * Math.pow(2, longCycleCount), MAX_LONG_CYCLE_DELAY);
      longCycleCount++;
      return withJitter(delay);
    }

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
        idRetryCount = 0;
        longCycleCount = 0;
        console.log("[MosqueRemote] peer open, guid:", currentGuid);
        const { token: t } = loadOrCreateToken();
        tokenRef.current = t;
        setRemoteUrl(buildUrl(currentGuid, t));
      });

      peer.on("connection", (conn) => {
        if (destroyed) { conn.close(); return; }

        // Per-connection data-channel keepalive. Idle UDP flows get dropped
        // by NAT/routers on both ends after ~30-60s with no traffic, which
        // silently kills the DataConnection without a "close"/"error" event
        // ever firing — leaving the TV stuck thinking a dead phone is still
        // connected. Pinging over the channel itself (not just the broker
        // socket) keeps the NAT mapping alive and lets us detect real death.
        let lastRx = Date.now();
        let healthId = null;

        function startHealthCheck() {
          if (healthId) clearInterval(healthId);
          healthId = setInterval(() => {
            if (!conn.open) return;
            if (Date.now() - lastRx > 30000) {
              try { conn.close(); } catch { /* noop */ }
              return;
            }
            try { conn.send({ type: "PING" }); } catch { /* noop */ }
          }, 10000);
        }

        function stopHealthCheck() {
          if (healthId) { clearInterval(healthId); healthId = null; }
        }

        conn.on("data", async (data) => {
          if (destroyed || !data || typeof data !== "object") return;
          lastRx = Date.now();
          if (data.type === "PING") return;

          // Authenticated command
          if (data.type !== "AUTH") {
            if (authRef.current && connRef.current === conn) {
              onCommandRef.current?.(data);
            }
            return;
          }

          // AUTH attempt
          const { token: sentToken, passcode: sentPasscode } = data.payload ?? {};
          console.log("[MosqueRemote] AUTH — token match:", sentToken === tokenRef.current, "hasPasscode:", hasPasscode());

          if (sentToken && sentToken === tokenRef.current) {
            _acceptPhone(conn);
            startHealthCheck();
            return;
          }

          if (sentPasscode && hasPasscode()) {
            const ok = await verifyPasscode(sentPasscode);
            if (ok) { _acceptPhone(conn); startHealthCheck(); return; }
            conn.send({ type: "AUTH_FAIL", payload: { reason: "Fjalëkalimi është i gabuar." } });
            return;
          }

          conn.send({
            type: "AUTH_FAIL",
            payload: { reason: "Token i skaduar.", canUsePasscode: hasPasscode() },
          });
        });

        conn.on("close", () => {
          stopHealthCheck();
          if (connRef.current !== conn) return;
          connRef.current = null;
          authRef.current = false;
          setConnected(false);
          setRemoteName(null);
        });

        conn.on("error", () => {
          stopHealthCheck();
          if (connRef.current !== conn) return;
          connRef.current = null;
          authRef.current = false;
          setConnected(false);
          setRemoteName(null);
        });
      });

      peer.on("error", (err) => {
        if (err?.type === "network") {
          return;
        }
        console.warn("[MosqueRemote] peer error:", err?.type || err?.message);
        if (!destroyed && err?.type === "unavailable-id") {
          try { peer.destroy(); } catch { /* noop */ }
          idRetryCount++;
          if (idRetryCount <= MAX_ID_RETRIES) {
            // The broker likely hasn't released our own previous registration
            // yet (e.g. after a brief network blip) — retry the SAME id with
            // backoff instead of abandoning it, so an already-scanned QR code
            // / already-connected phone doesn't get orphaned by a guid change.
            setTimeout(connect, Math.min(2000 * idRetryCount, 10000));
          } else {
            // Truly stuck (id genuinely taken elsewhere) — fall back to a
            // fresh guid so the TV can come back online at all.
            idRetryCount = 0;
            localStorage.removeItem("mosque_room_guid");
            setTimeout(connect, 1500);
          }
        }
      });

      peer.on("disconnected", () => {
        if (destroyed) return;
        retryCount++;
        if (retryCount > MAX_RETRIES) {
          const delay = longCycleDelay();
          console.warn("[MosqueRemote] broker unreachable after", MAX_RETRIES, "retries — will retry in", Math.round(delay / 1000) + "s");
          setTimeout(() => {
            if (destroyed) return;
            retryCount = 0;
            try { peer.destroy(); } catch { }
            connect();
          }, delay);
          return;
        }
        const delay = withJitter(Math.min(5000 * Math.pow(2, retryCount - 1), 30000));
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
        retryCount++;
        if (retryCount > MAX_RETRIES) {
          setTimeout(() => { if (!destroyed) { retryCount = 0; connect(); } }, longCycleDelay());
          return;
        }
        setTimeout(connect, withJitter(Math.min(5000 * Math.pow(2, retryCount - 1), 30000)));
      });
    }

    function _acceptPhone(conn) {
      if (connRef.current && connRef.current !== conn) {
        try { connRef.current.close(); } catch { /* already gone */ }
      }
      connRef.current = conn;
      authRef.current = true;
      setConnected(true);
      setRemoteName("Remote");
      conn.send({ type: "AUTH_OK" });
      onConnectRef.current?.((data) => { if (conn.open) conn.send(data); });
    }

    connect();

    return () => {
      destroyed = true;
      try { connRef.current?.close(); } catch { /* noop */ }
      // Destroy immediately, even if the peer hasn't finished opening yet —
      // Peer#destroy() closes the broker socket synchronously either way.
      // Deferring until "open"/"error" (as this used to do) leaves the old
      // peer alive long enough to race a freshly-mounted one for the same
      // room id under React StrictMode's mount→unmount→remount cycle,
      // which the broker resolves by rejecting one side with "unavailable-id"
      // — producing a spurious QR/guid churn loop that looks like constant
      // disconnects even though nothing is actually wrong.
      const p = peerRef.current;
      if (p && !p.destroyed) {
        try { p.destroy(); } catch { /* noop */ }
      }
    };
  }, [buildUrl]);

  // ── Token expiry watcher ─────────────────────────────────────────────────
  // Runs every second but only touches React state when the token actually
  // needs regenerating (every TOKEN_TTL_MS) — the live per-second countdown
  // UI (QRPanel) reads localStorage directly via a ref instead of state, so
  // this never needs to re-render the whole app tree just for a tick.
  useEffect(() => {
    let intervalId;
    function tick() {
      const raw = localStorage.getItem("mosque_room_token");
      if (raw) {
        const { expiresAt } = JSON.parse(raw);
        if (Date.now() >= expiresAt && !authRef.current) {
          const { token } = loadOrCreateToken();
          tokenRef.current = token;
          setRemoteUrl(buildUrl(guidRef.current, token));
        }
      }
    }
    tick();
    intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [buildUrl]);

  const sendToRemote = (data) => {
    if (authRef.current && connRef.current?.open) {
      connRef.current.send(data);
    }
  };

  return { remoteUrl, connected, remoteName, sendToRemote };
}
