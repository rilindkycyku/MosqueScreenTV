// ─── Google Analytics for an offline-capable PWA ────────────────────────────
//
// Two things quietly break GA once the app is installed / left running, and
// both of them make real usage look far smaller than it is:
//
//  1. The document outlives the "visit". On an installed PWA — and even more
//     so on a mosque TV that never gets closed — index.html is parsed ONCE.
//     React mounts once, so the single page_view fired at mount is the only
//     hit GA ever sees. Every relaunch from the home screen, every wake from
//     standby, every day the screen keeps running is invisible until someone
//     does a hard refresh. Handled below by watching the page lifecycle and
//     re-sending page_view whenever the app comes back after GA4's 30 minute
//     session timeout, plus a heartbeat so a screen that runs for days is
//     reported as actually running.
//
//  2. Offline hits are lost for good. gtag.js is fetched from the network, so
//     an offline launch has no GA at all, and anything pushed into dataLayer
//     while the library is missing dies with the page. Handled below by a
//     queue that survives reloads and is replayed once the device is back
//     online.
//
// Replayed hits carry `offline_replay: 1` plus `queued_seconds` /
// `offline_time`, because GA4 stamps a hit when it *arrives*: without those
// params an event from last night's power cut would look like it happened at
// breakfast. Segment on them if the arrival time matters to a report.

const GA_ID = 'G-76Y1SQYZC1';

// This app is an appliance the mosque installs on its own TV, not a website
// with visitors, but analytics still starts denied so nothing is assumed.
// While it is denied GA only sends cookieless pings — no cookies, no stable
// client id, so users/sessions in the GA reports stay modelled and thin, and
// nothing is written to localStorage here either. Set this to true (or ship a
// consent UI that writes `cookie-consent`) to get real session numbers.
const CONSENT_DEFAULT_GRANTED = false;

const QUEUE_KEY = 'ga-offline-queue';
const QUEUE_LIMIT = 200;
// GA4 closes a session after 30 minutes without a hit.
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
// Below this, a resume is just a blink (dialog closing, screensaver) — no event.
const RESUME_MIN_MS = 60 * 1000;
// Keeps a 24/7 screen inside a live session and reports its real uptime.
const HEARTBEAT_MS = 25 * 60 * 1000;

// ─── Module Level Queueing ──────────────────────────────────────────────────
// This ensures gtag() can be called even before the script finishes loading
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
window.gtag = gtag;

const bootedAt = Date.now();
let started = false;
let scriptLoaded = false;
let scriptPending = false;
let queue = [];
let lastActiveAt = Date.now();
let offlineSince = null;
let heartbeatTimer = null;

const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

const readStore = (key) => {
    try { return localStorage.getItem(key); } catch (e) { return null; }
};
const writeStore = (key, value) => {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode / full quota */ }
};
const clearStore = (key) => {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
};

const hasConsent = () => {
    try {
        const raw = readStore('cookie-consent');
        if (raw) return JSON.parse(raw).accepted === true;
    } catch (e) {
        // Ignore parsing errors
    }
    return CONSENT_DEFAULT_GRANTED;
};

// The queue always lives in memory; it is only written to disk with consent,
// so a declined install never leaves analytics data behind on the device.
const persistQueue = () => {
    if (!queue.length || !hasConsent()) {
        clearStore(QUEUE_KEY);
        return;
    }
    writeStore(QUEUE_KEY, JSON.stringify(queue));
};

const restoreQueue = () => {
    const raw = readStore(QUEUE_KEY);
    if (!raw) return;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) queue = parsed.slice(-QUEUE_LIMIT);
    } catch (e) {
        clearStore(QUEUE_KEY);
    }
};

// Tells an installed/TV launch apart from someone poking at the URL in a browser.
const displayMode = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'unknown';
    if (document.referrer.startsWith('android-app://')) return 'twa';
    const modes = ['fullscreen', 'standalone', 'minimal-ui'];
    const match = modes.find((mode) => window.matchMedia(`(display-mode: ${mode})`).matches);
    if (match) return match;
    return window.navigator.standalone ? 'standalone' : 'browser';
};

// GA4 only accepts letters, digits and underscores, 40 chars max.
const safeName = (name) => String(name).trim().replace(/[^A-Za-z0-9_]/g, '_').slice(0, 40);

const launchParams = () => ({
    display_mode: displayMode(),
    sw_controlled: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
    booted_offline: !isOnline(),
});

const loadScript = () => {
    if (scriptLoaded || scriptPending || !GA_ID || !isOnline()) return;
    scriptPending = true;
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    script.onload = () => {
        scriptPending = false;
        scriptLoaded = true;
        flushQueue();
    };
    script.onerror = () => {
        // Offline or blocked. Drop the tag and retry on the next 'online'
        // event instead of leaving a dead script in the head.
        scriptPending = false;
        script.remove();
    };
    document.head.appendChild(script);
};

const flushQueue = () => {
    if (!queue.length || !scriptLoaded || !isOnline()) return;
    const pending = queue;
    queue = [];
    persistQueue();
    const now = Date.now();
    pending.forEach((entry) => {
        // Only hits that were actually taken offline get the replay params —
        // an event queued for the two seconds gtag.js takes to load is not an
        // offline session and should not pollute the reports as one.
        if (!entry.o) {
            window.gtag('event', entry.n, entry.p);
            return;
        }
        window.gtag('event', entry.n, {
            ...entry.p,
            offline_replay: 1,
            queued_seconds: Math.max(0, Math.round((now - entry.t) / 1000)),
            offline_time: new Date(entry.t).toISOString(),
        });
    });
};

const track = (name, params = {}) => {
    if (!GA_ID) return;
    const eventName = safeName(name);
    if (scriptLoaded && isOnline()) {
        window.gtag('event', eventName, params);
        return;
    }
    queue.push({ n: eventName, p: params, t: Date.now(), o: isOnline() ? 0 : 1 });
    if (queue.length > QUEUE_LIMIT) queue = queue.slice(-QUEUE_LIMIT);
    persistQueue();
};

const sendPageView = (extra = {}) => {
    track('page_view', {
        page_path: window.location.pathname + window.location.search,
        page_location: window.location.href,
        page_title: document.title,
        ...launchParams(),
        ...extra,
    });
};

// Called whenever the app comes back to the foreground — the moment GA used to
// miss completely, because nothing reloads when a PWA is resumed.
const handleResume = () => {
    const awayMs = Date.now() - lastActiveAt;
    lastActiveAt = Date.now();

    loadScript();
    flushQueue();

    if (awayMs >= SESSION_TIMEOUT_MS) {
        // GA4 has already dropped the session. Without this page_view the
        // relaunch is never counted at all.
        sendPageView({ resume: 1, away_seconds: Math.round(awayMs / 1000) });
        track('app_resume', { away_seconds: Math.round(awayMs / 1000), new_session: 1 });
    } else if (awayMs >= RESUME_MIN_MS) {
        track('app_resume', { away_seconds: Math.round(awayMs / 1000), new_session: 0 });
    }
};

const startHeartbeat = () => {
    if (heartbeatTimer || HEARTBEAT_MS <= 0) return;
    heartbeatTimer = setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        const now = Date.now();
        const elapsed = now - lastActiveAt;
        lastActiveAt = now;
        track('screen_heartbeat', {
            // The screen really was on for this long, so report it as
            // engagement — that is what turns a 24/7 display from "one 0s
            // session per boot" into actual usage.
            engagement_time_msec: Math.min(elapsed, HEARTBEAT_MS * 2),
            uptime_minutes: Math.round((now - bootedAt) / 60000),
        });
    }, HEARTBEAT_MS);
};

const installLifecycleHooks = () => {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            lastActiveAt = Date.now();
            persistQueue();
            return;
        }
        handleResume();
    });

    // Back/forward cache restore: the document is reused, so nothing else fires.
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) handleResume();
    });

    // Chrome page lifecycle: a frozen tab that is brought back.
    document.addEventListener('resume', handleResume);

    window.addEventListener('pagehide', () => {
        lastActiveAt = Date.now();
        persistQueue();
    });

    window.addEventListener('online', () => {
        loadScript();
        flushQueue();
        track('connection_restored', {
            offline_seconds: offlineSince ? Math.round((Date.now() - offlineSince) / 1000) : 0,
        });
        offlineSince = null;
    });

    window.addEventListener('offline', () => {
        offlineSince = Date.now();
        // Queued by definition — this is what proves the app was used offline.
        track('connection_lost', launchParams());
    });

    window.addEventListener('appinstalled', () => {
        track('pwa_install', { display_mode: displayMode() });
    });

    startHeartbeat();
};

export const initGA = () => {
    if (started || !GA_ID) return;
    started = true;

    restoreQueue();

    // Set default consent mode BEFORE initializing GA
    const consent = hasConsent();
    gtag('consent', 'default', {
        'analytics_storage': consent ? 'granted' : 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
    });

    gtag('js', new Date());
    gtag('config', GA_ID, {
        send_page_view: false, // We send manually via logPageView
        ...launchParams(),
    });

    // Inject the script (a no-op while offline; retried once we reconnect)
    loadScript();
    installLifecycleHooks();
};

export const updateConsent = (accepted) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
            'analytics_storage': accepted ? 'granted' : 'denied'
        });
    }
    // Consent just granted: persist whatever is queued so a reload keeps it.
    // Consent withdrawn: persistQueue() drops the stored copy.
    persistQueue();
};

export const logPageView = () => {
    sendPageView();
};

// Accepts the GA4 shape logEvent('name', { param: value }) and the older
// positional shape still used around the app: logEvent('Settings', 'Save', 'tv').
// The positional form used to send a bare string where gtag expects an object,
// so those events arrived stripped of every detail.
export const logEvent = (eventName, params = {}, label) => {
    if (typeof params === 'string') {
        const normalized = { event_action: params };
        if (label !== undefined) normalized.event_label = String(label);
        track(eventName, normalized);
        return;
    }
    track(eventName, params);
};
