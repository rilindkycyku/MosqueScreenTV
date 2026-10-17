// lib/swUpdate.js — get a new release onto a screen that never reloads.
//
// Screens were seen running an old version for days after a deploy. The
// service worker only looks for a new sw.js when the page navigates, and this
// page is never navigated: it is opened once and left for weeks. Even when a
// navigation did happen, that page was served by the OLD worker from its
// precache; the new worker installed behind it (skipWaiting + clientsClaim)
// and the new code only appeared on the reload after that. The old
// "reload 4 times a day" was the only thing that ever moved a screen forward,
// and it skipped whenever the instant it fired fell outside the Hadith slide.
//
// So this module registers the worker itself (injectRegister is off in
// vite.config.js), asks it to check for an update every hour while online, and
// marks an update as ready once a new worker has taken control of the page.
// It never reloads on its own: App.jsx's safe-reload check does that, gated
// like every other self-heal path (idle rotation, not near a prayer, settings
// closed), because a reload during the minute before Sabah is the one thing
// the screen must never do.

const CHECK_EVERY_MS = 60 * 60 * 1000;

let updateReady = false;

export function isUpdateReady() {
    return updateReady;
}

export function registerServiceWorker() {
    if (!import.meta.env.PROD) return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    // controllerchange also fires the first time a worker claims a page that
    // had none (first install); that is not an update and needs no reload.
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (hadController) updateReady = true;
        hadController = true;
    });

    const start = () => {
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
            setInterval(() => {
                if (!navigator.onLine) return;
                reg.update().catch(() => { /* offline or server hiccup; next hour */ });
            }, CHECK_EVERY_MS);
        }).catch(() => { /* no worker (plain HTTP, private mode): app still runs */ });
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start);
}
