import { memo, useEffect, useRef, useState } from 'react';

/*
 * Keeps the TV from going to sleep — without putting a media player on screen.
 *
 * What went wrong on Android TV (the Dahua LTV43-SD200 in the mosque, Android 11):
 *
 *  - The keepalive <video> was 1×1 px and muted, and Chromium only lets a playing
 *    video hold the screen on if it is audible, or if it covers more than 20% of
 *    the viewport with more than 75% of itself on screen (blink's
 *    VideoWakeLock::ShouldBeActive). So it held nothing. Where the browser has the
 *    Screen Wake Lock API that lock did the work alone; where it doesn't (the
 *    WebView-based browsers most Android TVs run, or the app served over plain
 *    HTTP on the LAN) nothing kept the screen on at all.
 *  - It carried an audio track and was paused and resumed every 50 s for webOS.
 *    A playing element with sound is what TV browsers and the OS hang their
 *    player UI on, and every resume is a fresh "playback started" — the player
 *    with a seek bar that kept coming back for people who don't know how to
 *    close it.
 *
 * So, everywhere except webOS/Tizen:
 *
 *  1. The Screen Wake Lock is the lock. While it is held there is no media
 *     element on the page at all. Android WebView grants it like Chrome does
 *     (since 84), so this covers the WebView-based TV browsers too — as long as
 *     the page is served over HTTPS.
 *  2. Only when the browser has no Wake Lock API, or refuses the lock twice in a
 *     row while the page is on screen, does a video take over — one that actually
 *     qualifies: full-screen but invisible (opacity 0; IntersectionObserver
 *     ignores opacity), no audio track at all (public/keepalive.mp4), never
 *     paused on purpose, and restarted by a watchdog if the browser stops it. It
 *     steps aside again as soon as the lock is held.
 *  3. Some TV browsers (the mosque's "Browser", com.internet.tvbrowser) detect any
 *     <video> on a page and open it in their own full-screen player — for those
 *     even the fallback is the problem, so it can be switched off in the settings
 *     (keepaliveVideo). The settings panel also shows which of these is keeping
 *     the screen on (useKeepAwakeStatus), since a TV has no dev tools to check.
 *
 * webOS and Tizen keep the old behaviour exactly (tiny silent.mp4 with its
 * audio track, pause/resume cycle, silent AudioContext, synthetic input) — that
 * is what those screens were tuned on, and none of this was verified there.
 *
 * What no web page can do: Android TV's "turn off after N hours without remote
 * input" (the EU 4-hour default, Android's attentive timeout) ignores every wake
 * lock, and synthetic key/mouse events never leave the page. That one has to be
 * switched off in the TV's own settings.
 */

const UA = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
// LG (webOS, NetCast before it) and Samsung (Tizen).
const IS_LEGACY_TV_OS = /web0s|webos|netcast|tizen/i.test(UA);
// [SecureContext]: absent over plain HTTP, e.g. a self-hosted build on the LAN.
const HAS_WAKE_LOCK_API = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

// Suppress OS-level media transport overlay (play/pause/seek) that Android TV /
// WebOS show whenever they detect an actively playing <video>/<audio> element.
// The keepalive video is invisible plumbing, not user-facing media.
const suppressMediaSessionUi = () => {
    if (!('mediaSession' in navigator)) return;
    try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
        // Android TV Chrome falls back to its native media-transport overlay
        // when a registered action has no handler (i.e. handler === null).
        // A no-op function fully swallows the remote's media keys instead.
        const noop = () => {};
        ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'seekto', 'previoustrack', 'nexttrack']
            .forEach(action => {
                try { navigator.mediaSession.setActionHandler(action, noop); } catch (e) { /* unsupported action */ }
            });
    } catch (e) { /* mediaSession not fully supported */ }
};

// What is keeping the screen on right now: 'wakelock' | 'video' | 'legacy' |
// 'none'. Module-level so the settings panel can read it without KeepAwake
// re-rendering App.
let currentStatus = 'none';
const statusListeners = new Set();
const publishStatus = (status) => {
    if (status === currentStatus) return;
    currentStatus = status;
    statusListeners.forEach(listener => listener(status));
};

export function useKeepAwakeStatus() {
    const [status, setStatus] = useState(currentStatus);
    useEffect(() => {
        statusListeners.add(setStatus);
        setStatus(currentStatus);
        return () => { statusListeners.delete(setStatus); };
    }, []);
    return status;
}

const playQuietly = (vid) => {
    try {
        const p = vid.play();
        if (p && p.catch) p.catch(() => {});
    } catch (e) { /* play() threw synchronously on an old engine */ }
};

// Screen Wake Lock, held for as long as the page is on screen. The browser drops
// it whenever the page is hidden; it is taken back as soon as the page is visible
// again, and straight away if it is ever dropped while still visible.
// onHeldChange(bool) follows the lock; onRefusedChange(bool) turns true after two
// refusals in a row while on screen — one refusal can be a race with a
// visibility change, and each false alarm would put a video on the page.
function useScreenWakeLock(onHeldChange, onRefusedChange) {
    const callbacksRef = useRef({ onHeldChange, onRefusedChange });
    callbacksRef.current = { onHeldChange, onRefusedChange };

    useEffect(() => {
        if (!HAS_WAKE_LOCK_API) return undefined;
        let lock = null;
        let pending = false;
        let isActive = true;
        let retryTimeout = null;
        let refusals = 0;

        const isVisible = () => document.visibilityState === 'visible';
        const retryIn = (ms) => {
            if (retryTimeout) clearTimeout(retryTimeout);
            retryTimeout = setTimeout(request, ms);
        };

        function request() {
            if (!isActive || lock || pending || !isVisible()) return;
            pending = true;
            let promise;
            try { promise = navigator.wakeLock.request('screen'); } catch (err) { promise = Promise.reject(err); }
            promise.then((sentinel) => {
                pending = false;
                if (!isActive) { sentinel.release().catch(() => {}); return; }
                lock = sentinel;
                refusals = 0;
                callbacksRef.current.onRefusedChange(false);
                callbacksRef.current.onHeldChange(true);
                sentinel.addEventListener('release', () => {
                    lock = null;
                    if (!isActive) return;
                    callbacksRef.current.onHeldChange(false);
                    if (isVisible()) retryIn(250);
                });
            }, () => {
                pending = false;
                if (!isActive || !isVisible()) return;
                refusals += 1;
                if (refusals >= 2) callbacksRef.current.onRefusedChange(true);
                retryIn(10000);
            });
        }

        request();
        const heartbeatInterval = setInterval(() => { if (!lock) request(); }, 30000);
        const handleVisibilityChange = () => { if (isVisible()) request(); };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isActive = false;
            if (retryTimeout) clearTimeout(retryTimeout);
            clearInterval(heartbeatInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (lock) lock.release().catch(() => {});
            lock = null;
        };
    }, []);
}

// Fallback for browsers without a usable Wake Lock (see the header comment).
function KeepaliveVideo() {
    const videoRef = useRef(null);

    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return undefined;
        // React only ever sets `muted` as a property, never as an attribute
        // (facebook/react#10389); some TV browsers read the attribute.
        vid.muted = true;
        vid.defaultMuted = true;
        vid.setAttribute('muted', '');
        suppressMediaSessionUi();

        // Nothing pauses it on purpose: a pause drops the video wake lock, and
        // every resume is a new "playback started" for the browser to react to.
        // The watchdog only restarts it when the browser stopped it — a decoder
        // reclaimed under memory pressure, a stalled load. A frozen or errored
        // element is reloaded, at most every 5 minutes so a TV that can't decode
        // it isn't made to re-create a decoder every 30 s.
        let lastTime = -1;
        let lastReload = 0;
        const watchdog = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            const frozen = !vid.paused && vid.currentTime === lastTime;
            lastTime = vid.currentTime;
            if ((vid.error || frozen) && Date.now() - lastReload > 5 * 60000) {
                lastReload = Date.now();
                vid.load();
            }
            if (vid.paused || vid.ended) playQuietly(vid);
        }, 30000);

        // Muted autoplay needs no gesture in current Chromium, but older WebView
        // browsers can still insist on one: the first remote key press starts it.
        const onKey = () => { if (vid.paused) playQuietly(vid); };
        window.addEventListener('keydown', onKey, true);

        return () => {
            clearInterval(watchdog);
            window.removeEventListener('keydown', onKey, true);
        };
    }, []);

    return (
        <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload nofullscreen noremoteplayback"
            tabIndex={-1}
            aria-hidden="true"
            src="/keepalive.mp4"
            onPlay={suppressMediaSessionUi}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0, pointerEvents: 'none' }}
        />
    );
}

// webOS / Tizen: the keepalive as it has always been, unchanged.
function LegacyKeepalive() {
    const videoRef = useRef(null);

    // Synthetic Pointer Move: Defeat screensavers on Tizen/WebOS browsers
    useEffect(() => {
        const interval = setInterval(() => {
            const x = Math.floor(Math.random() * window.innerWidth);
            const y = Math.floor(Math.random() * window.innerHeight);
            const event = new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y
            });
            window.dispatchEvent(event);
        }, 60000); // 1 minute — LG WebOS inactivity threshold is ~90s

        return () => clearInterval(interval);
    }, []);

    // Silent Audio Heartbeat: Keep audio pipeline alive on WebOS
    useEffect(() => {
        let audioCtx = null;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                gainNode.gain.value = 0; // Completely silent
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();
            }
        } catch (e) { /* Ignore audio context errors */ }

        // Browsers can start (or autoplay-suspend) the context in a "suspended"
        // state, which silently defeats this heartbeat — resume whenever the
        // screen becomes visible again.
        const resumeAudio = () => {
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
        };
        document.addEventListener('visibilitychange', resumeAudio);
        resumeAudio();

        return () => {
            document.removeEventListener('visibilitychange', resumeAudio);
            if (audioCtx && audioCtx.state !== 'closed') {
                audioCtx.close().catch(() => {});
            }
        };
    }, []);

    useEffect(() => {
        suppressMediaSessionUi();
    }, []);

    // LG WebOS Keep-Alive: Keydown Heartbeat
    // Dispatches a harmless keydown event every 45 seconds to satisfy
    // the WebOS input activity detector and prevent idle timeout.
    useEffect(() => {
        const interval = setInterval(() => {
            const event = new KeyboardEvent('keydown', {
                bubbles: true, cancelable: true,
                keyCode: 0, which: 0, key: 'Unidentified'
            });
            document.dispatchEvent(event);
        }, 45000);
        return () => clearInterval(interval);
    }, []);

    // LG WebOS Keep-Alive: Video Pause/Resume Cycle
    // Periodically pauses and resumes the silent video element every 50 seconds
    // to trigger media state changes that WebOS registers as activity.
    // NOTE: silent.mp4 must have a silent audio track (not just video) for WebOS
    // to count it as media activity. Generate with:
    // ffmpeg -f lavfi -i color=black:s=2x2:r=1 -f lavfi -i anullsrc=r=44100:cl=mono \
    //   -t 3600 -c:v libx264 -c:a aac -shortest silent.mp4
    useEffect(() => {
        const interval = setInterval(() => {
            const vid = videoRef.current;
            if (vid) {
                vid.pause();
                setTimeout(() => {
                    vid.play().catch(() => {});
                    suppressMediaSessionUi();
                }, 300);
            }
        }, 50000);
        return () => clearInterval(interval);
    }, []);

    return (
        <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload nofullscreen noremoteplayback"
            tabIndex={-1}
            aria-hidden="true"
            src="/silent.mp4"
            onLoadedMetadata={suppressMediaSessionUi}
            onPlay={suppressMediaSessionUi}
            style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
        />
    );
}

const KeepAwake = memo(function KeepAwake({ allowVideo = true }) {
    const [held, setHeld] = useState(false);
    const [refused, setRefused] = useState(false);
    useScreenWakeLock(setHeld, setRefused);

    const showVideo = IS_LEGACY_TV_OS || (allowVideo && !held && (!HAS_WAKE_LOCK_API || refused));

    useEffect(() => {
        publishStatus(IS_LEGACY_TV_OS ? 'legacy' : held ? 'wakelock' : showVideo ? 'video' : 'none');
    }, [held, showVideo]);

    if (!showVideo) return null;
    return IS_LEGACY_TV_OS ? <LegacyKeepalive /> : <KeepaliveVideo />;
});

export default KeepAwake;
