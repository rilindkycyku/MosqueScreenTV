
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
//
// HARDENING:
//   - Anyone who scanned the QR once keeps the room guid for good, and the
//     guid alone lets them open a DataConnection. AUTH failures are therefore
//     counted across ALL connections (a fresh connection per guess would
//     dodge a per-connection limit) and lock AUTH out with a growing delay.
//   - rotateRoom() mints a new guid + token, so a QR that leaked stops
//     reaching this TV at all; it is the panel's "Ndrysho Lidhjen" button.
//   - Token and guid come from crypto.getRandomValues where it exists:
//     Math.random() is predictable, and randomUUID() is missing over plain
//     HTTP and on the old TV browsers this app targets.

import { useCallback, useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { hasPasscode, verifyPasscode } from "./passcodeUtils";

const TOKEN_TTL_MS = 5 * 60 * 1000;
const TOKEN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// PeerJS rejects ids with characters outside [A-Za-z0-9_-], so the raw UUID
// (which contains dashes — allowed) is fine, but we prefix to avoid collisions
// with other apps on the shared public broker.
const PEER_PREFIX = "mosquetv-";

// Five failures are free (an expired QR scanned a few times is not an
// attack); after that each further failure locks AUTH for the next step.
const AUTH_FREE_FAILURES = 5;
const AUTH_LOCK_STEPS_MS = [30000, 60000, 5 * 60000, 15 * 60000];
// A quiet spell this long forgets old failures.
const AUTH_FAILURE_RESET_MS = 30 * 60000;

// n random bytes; crypto when available, Math.random only as a last resort.
function randomBytes(n) {
  const out = new Uint8Array(n);
  const c = typeof crypto !== "undefined" ? crypto : null;
  if (c && c.getRandomValues) c.getRandomValues(out);
  else for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  return out;
}

function genToken() {
  // 32 symbols divide 256 evenly, so `byte % 32` carries no bias.
  return Array.from(randomBytes(6), (b) => TOKEN_CHARS[b % TOKEN_CHARS.length]).join("");
}

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  const b = randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  const h = Array.from(b, (x) => (x < 16 ? "0" : "") + x.toString(16)).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
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
  const rotateRef = useRef(null);
  // Shared by every connection — see HARDENING above.
  const authFailRef = useRef({ count: 0, lockedUntil: 0, lastFail: 0 });

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
      // A retry timer armed by a peer that rotateRoom() has since replaced
      // must not register a second peer next to the live one.
      const live = peerRef.current;
      if (live && !live.destroyed && !live.disconnected) return;

      currentGuid = loadOrCreateGuid();
      guidRef.current = currentGuid;

      // Peer id == prefixed guid, so the phone reaches us via the room guid.
      const peer = new Peer(`${PEER_PREFIX}${currentGuid}`);
      peerRef.current = peer;

      // After rotateRoom() swaps in a new peer, the old one's late events
      // must not reconnect it or touch connection state.
      const stale = () => destroyed || peerRef.current !== peer;

      peer.on("open", () => {
        if (stale()) { peer.destroy(); return; }
        retryCount = 0; // reset on success
        idRetryCount = 0;
        longCycleCount = 0;
        console.log("[MosqueRemote] peer open, guid:", currentGuid);
        const { token: t } = loadOrCreateToken();
        tokenRef.current = t;
        setRemoteUrl(buildUrl(currentGuid, t));
      });

      peer.on("connection", (conn) => {
        if (stale()) { conn.close(); return; }

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
          const fails = authFailRef.current;
          const now = Date.now();
          if (now < fails.lockedUntil) {
            const secs = Math.ceil((fails.lockedUntil - now) / 1000);
            conn.send({
              type: "AUTH_FAIL",
              payload: { reason: `Shumë prova të gabuara. Provo pas ${secs} sekondash.`, canUsePasscode: hasPasscode() },
            });
            return;
          }
          if (fails.count && now - fails.lastFail > AUTH_FAILURE_RESET_MS) fails.count = 0;

          const { token: sentToken, passcode: sentPasscode } = data.payload ?? {};
          console.log("[MosqueRemote] AUTH — token match:", sentToken === tokenRef.current, "hasPasscode:", hasPasscode());

          if (sentToken && sentToken === tokenRef.current) {
            fails.count = 0;
            _acceptPhone(conn);
            startHealthCheck();
            return;
          }

          if (sentPasscode && hasPasscode()) {
            const ok = await verifyPasscode(sentPasscode);
            if (ok) { fails.count = 0; _acceptPhone(conn); startHealthCheck(); return; }
            _recordAuthFailure();
            conn.send({ type: "AUTH_FAIL", payload: { reason: "Fjalëkalimi është i gabuar." } });
            return;
          }

          _recordAuthFailure();
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
        if (stale()) return;
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
        if (stale()) return;
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
        if (stale()) return;
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

    function _recordAuthFailure() {
      const fails = authFailRef.current;
      fails.count++;
      fails.lastFail = Date.now();
      const over = fails.count - AUTH_FREE_FAILURES;
      if (over > 0) {
        const step = AUTH_LOCK_STEPS_MS[Math.min(over - 1, AUTH_LOCK_STEPS_MS.length - 1)];
        fails.lockedUntil = fails.lastFail + step;
        console.warn("[MosqueRemote] AUTH locked for", step / 1000, "s after", fails.count, "failures");
      }
    }

    // New guid + token: the old QR (and anyone who kept its room id) no longer
    // reaches this TV, and the phone connected now is dropped.
    function rotateRoom() {
      if (destroyed) return;
      localStorage.removeItem("mosque_room_guid");
      localStorage.removeItem("mosque_room_token");
      try { connRef.current?.close(); } catch { /* noop */ }
      connRef.current = null;
      authRef.current = false;
      setConnected(false);
      setRemoteName(null);
      authFailRef.current = { count: 0, lockedUntil: 0, lastFail: 0 };
      const old = peerRef.current;
      peerRef.current = null; // marks the old peer stale before destroy() fires its events
      if (old && !old.destroyed) {
        try { old.destroy(); } catch { /* noop */ }
      }
      retryCount = 0;
      idRetryCount = 0;
      longCycleCount = 0;
      const { token } = loadOrCreateToken();
      tokenRef.current = token;
      setRemoteUrl(buildUrl(loadOrCreateGuid(), token));
      connect();
    }
    rotateRef.current = rotateRoom;

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
      rotateRef.current = null;
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

  const rotateRoom = useCallback(() => { rotateRef.current?.(); }, []);

  return { remoteUrl, connected, remoteName, sendToRemote, rotateRoom };
}
