// lib/settingsBackup.js — keep the TV's settings through a power cut.
//
// Everything the screen needs to come back as it was (tv_settings, the remote
// passcode hash, the room guid behind the QR) lives in localStorage, and
// mosques reported a TV that came back from a power cut showing "Emri i
// Xhamisë" again with every setting gone. Chromium keeps localStorage in a
// LevelDB database: a write still in flight when the power drops can corrupt
// it, and Chromium's recovery for a corrupt database is to delete it — all of
// it, not just the last write. It also commits localStorage lazily, so a save
// made just before the cut may never reach disk.
//
// So every change is also copied into two stores that live in separate files:
// IndexedDB (its own LevelDB) and, where it exists, Cache Storage (plain files;
// only over HTTPS). One cut is very unlikely to take out all three. At boot,
// main.jsx awaits restoreFromBackup() BEFORE the app renders, so a wiped or
// stale localStorage is refilled before App, the remote hook or the passcode
// check ever read it — no flash of defaults, no new QR, no reload.
//
// Backups stay disabled until that restore has run: otherwise the first render
// after a wipe would back up the defaults over the good copy.
//
// navigator.storage.persist() is asked for too. With ~13.5 MB precached on a
// TV with little free space, "best-effort" storage is what the browser evicts
// first, and eviction wipes the origin the same way.

const KEYS = ["tv_settings", "mosque_remote_passcode_hash", "mosque_room_guid"];
const SAVED_AT_KEY = "tv_backup_savedAt";
const DB_NAME = "mosquetv-backup";
const STORE = "kv";
const CACHE_NAME = "mosquetv-backup";
const CACHE_URL = "/__mosquetv-backup/settings.json";
// A hung IndexedDB on an old TV browser must not keep the screen blank.
const RESTORE_TIMEOUT_MS = 1500;
const BACKUP_DEBOUNCE_MS = 1500;

let ready = false;
let pending = null;

function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return localStorage.getItem(k) === v; } catch (e) { return false; } }

function withTimeout(promise, ms) {
    return new Promise((resolve) => {
        const t = setTimeout(() => resolve(null), ms);
        promise.then((v) => { clearTimeout(t); resolve(v); }, () => { clearTimeout(t); resolve(null); });
    });
}

function openDb() {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") { reject(new Error("no indexedDB")); return; }
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function idbRead() {
    return openDb().then((db) => new Promise((resolve, reject) => {
        const req = db.transaction(STORE, "readonly").objectStore(STORE).get("settings");
        req.onsuccess = () => { db.close(); resolve(req.result || null); };
        req.onerror = () => { db.close(); reject(req.error); };
    }));
}

function idbWrite(payload) {
    return openDb().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(payload, "settings");
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    }));
}

function hasCaches() {
    return typeof caches !== "undefined" && caches && typeof caches.open === "function";
}

function cacheRead() {
    if (!hasCaches()) return Promise.resolve(null);
    return caches.open(CACHE_NAME)
        .then((c) => c.match(CACHE_URL))
        .then((res) => (res ? res.json() : null));
}

function cacheWrite(payload) {
    if (!hasCaches()) return Promise.resolve();
    return caches.open(CACHE_NAME).then((c) => c.put(
        CACHE_URL,
        new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } })
    ));
}

function isValid(p) {
    if (!p || typeof p !== "object" || !p.values || typeof p.values !== "object") return false;
    if (typeof p.values.tv_settings !== "string") return false;
    try { JSON.parse(p.values.tv_settings); return true; } catch (e) { return false; }
}

function localIsUsable() {
    const raw = lsGet("tv_settings");
    if (!raw) return false;
    try { JSON.parse(raw); return true; } catch (e) { return false; }
}

// Called once from main.jsx before rendering. Never rejects.
export function restoreFromBackup() {
    const run = Promise.all([
        withTimeout(idbRead(), RESTORE_TIMEOUT_MS),
        withTimeout(cacheRead(), RESTORE_TIMEOUT_MS),
    ]).then(([a, b]) => {
        const candidates = [a, b].filter(isValid).sort((x, y) => (y.savedAt || 0) - (x.savedAt || 0));
        const best = candidates[0];
        if (!best) return;
        const localSavedAt = Number(lsGet(SAVED_AT_KEY)) || 0;
        // Restore when localStorage was wiped/corrupted, or when it lost the
        // last save(s) and a backup is newer than what it holds.
        if (localIsUsable() && (best.savedAt || 0) <= localSavedAt) return;
        KEYS.forEach((k) => {
            const v = best.values[k];
            if (typeof v === "string") lsSet(k, v);
        });
        lsSet(SAVED_AT_KEY, String(best.savedAt || Date.now()));
        console.warn("[SettingsBackup] restored settings saved at", new Date(best.savedAt || 0).toISOString());
    }).catch(() => { /* restore is best-effort; the app still boots */ });

    return run.then(() => {
        ready = true;
        try {
            if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
        } catch (e) { /* noop */ }
    });
}

// Snapshot the current localStorage values into both backup stores. Cheap to
// call after any change; bursts (typing on the phone remote) are coalesced.
export function backupSettings() {
    if (!ready) return;
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => {
        pending = null;
        const values = {};
        KEYS.forEach((k) => {
            const v = lsGet(k);
            if (v != null) values[k] = v;
        });
        if (!values.tv_settings) return; // nothing worth keeping yet
        const payload = { savedAt: Date.now(), values };
        lsSet(SAVED_AT_KEY, String(payload.savedAt));
        idbWrite(payload).catch(() => {});
        cacheWrite(payload).catch(() => {});
    }, BACKUP_DEBOUNCE_MS);
}
