import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { HiCog } from "react-icons/hi";
// Components
import vaktetKS from './data/vaktet-e-namazit.json';
import vaktetAL from './data/vaktet-e-namazit-al.json';
import config from './data/config.json';
import haditheData from './data/hadithe.json';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import SettingsModal from './components/SettingsModal/SettingsModal';
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog';
import QuranRadio from './components/Display/QuranRadio';
import Clock from './components/Display/Clock';
import PrayerGrid from './components/Display/PrayerGrid';
import NextPrayer from './components/Display/NextPrayer';
import ActivityBox from './components/Display/ActivityBox';
// Vercel Analytics
import { Analytics } from '@vercel/analytics/react';
// Google Analytics
import { initGA, logPageView, logEvent } from './lib/analytics';

// Module-level pure utilities (never re-created)
const neMinuta = (ora) => {
    if (!ora) return 0;
    const [h, m] = ora.split(":").map(Number);
    return h * 60 + m;
};

const ne24h = (ora) => {
    if (!ora) return "—";
    const [h, m] = ora.split(":").map(Number);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const formatDallim = (min) => {
    if (min <= 0) return "0m";
    const o = Math.floor(min / 60);
    const m = min % 60;
    let res = "";
    if (o > 0) res += `${o}h `;
    if (m > 0 || o === 0) res += `${m}m`;
    return res.trim();
};

// Shared prayer label helper used by both updateNextPrayer and listaNamazeve
const getPrayerLabel = (id, { isR, isHome, isFriday }) => {
    if (id === 'Imsaku') return isR ? (isHome ? "Syfyri" : "Syfyri (Imsaku)") : "Imsaku";
    if (id === 'Akshami') return isR ? (isHome ? "Iftari" : "Iftari (Akshami)") : "Akshami";
    if (id === 'Jacia') return isR ? (isHome ? "Jacia" : "Teravia (Jacia)") : "Jacia";
    if (id === 'Sabahu' && isR && !isHome) return "Sabahu";
    if (id === 'Dreka' && isFriday && !isHome) return "Xhumaja";
    if (id === 'Xhuma1') return "Xhumaja";
    if (id === 'Xhuma2') return "Xhumaja II";
    if (id === 'NamazNate') return "Namaz i Natës";
    return id;
};

export default function App() {
    const [vaktiSot, setVaktiSot] = useState(null);
    const [infoTani, setInfoTani] = useState(null);
    const [currentHadith, setCurrentHadith] = useState(null);

    // Unified Settings State
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('tv_settings');
        const parsed = saved ? JSON.parse(saved) : {};

        return {
            ...config.tvOptions,
            customMsg: "",
            ...parsed,
            durations: {
                ...config.tvOptions.durations,
                ...(parsed.durations || {})
            },
            ramazan: {
                ...config.ramazan,
                ...(parsed.ramazan || {})
            },
            iqamah: {
                ...config.tvOptions.iqamah,
                ...(parsed.iqamah || {})
            }
        };
    });

    const [tempSettings, setTempSettings] = useState(settings);
    const [displayMode, setDisplayMode] = useState('hadith');
    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState('identity');
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ title: "", message: "", action: null });
    const [scale, setScale] = useState(1);
    const [isNightDimmed, setIsNightDimmed] = useState(false);
    // nextHadith queues a new hadith to swap in at the next cycle start (seamless swap)
    const [nextHadith, setNextHadith] = useState(null);
    // Ref mirrors currentHadith so the refresh timer can read it without being a dep
    const currentHadithRef = useRef(null);

    // Initialize Google Analytics
    useEffect(() => {
        initGA();
        logPageView();
    }, []);

    // Optimized Scaling Logic to fit any screen
    useEffect(() => {
        const handleResize = () => {
            const targetWidth = 1920;
            const targetHeight = 1080;
            const widthScale = window.innerWidth / targetWidth;
            const heightScale = window.innerHeight / targetHeight;
            setScale(Math.min(widthScale, heightScale));
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Optimized Duration Calculator with Legacy Sanitizer
    const durations = useMemo(() => {
        const raw = settings.durations || config.tvOptions.durations;
        const toMs = (v) => {
            const num = Number(v) || 0;
            return num > 1000 ? num : num * 60000;
        };
        return {
            hadith: toMs(raw.hadith ?? config.tvOptions.durations.hadith),
            qr: toMs(raw.qr ?? config.tvOptions.durations.qr),
            notification: toMs(raw.notification ?? config.tvOptions.durations.notification),
            announcement: toMs(raw.announcement ?? config.tvOptions.durations.announcement)
        };
    }, [JSON.stringify(settings.durations)]); // Use stringified durations for stable dependency

    // --- RECOVERY & STABILITY: LocalStorage Sync ---
    // This creates a safety backup of last-known valid state
    const saveToSafety = (key, data) => {
        try { localStorage.setItem(`safety_${key}`, JSON.stringify(data)); } catch (e) {}
    };
    const getFromSafety = (key) => {
        try { return JSON.parse(localStorage.getItem(`safety_${key}`)); } catch (e) { return null; }
    };

    // --- DISPLAY CYCLE CONTROL: Robust Timer Management ---
    useEffect(() => {
        let timeoutId;
        let isMounted = true;

        const showHadith = () => {
            if (!isMounted) return;
            setDisplayMode('hadith');
            if (nextHadith) {
                setCurrentHadith(nextHadith);
                setNextHadith(null);
            }
            const duration = settings.customMsg ? Math.min(durations.hadith, 30000) : durations.hadith;
            if (settings.showQr !== false && durations.qr > 0) timeoutId = setTimeout(showQR, duration);
            else timeoutId = setTimeout(showMsgIfAny, duration);
        };
        const showQR = () => {
            if (!isMounted) return;
            setDisplayMode('qr');
            const duration = settings.customMsg ? Math.min(durations.qr, 15000) : durations.qr;
            timeoutId = setTimeout(showMsgIfAny, duration);
        };
        const showMsgIfAny = () => {
            if (!isMounted) return;
            const hasMsg = vaktiSot?.Festat || vaktiSot?.Shenime;
            if (hasMsg && durations.announcement > 0) {
                setDisplayMode('message');
                timeoutId = setTimeout(showCustomIfAny, durations.announcement);
            } else showCustomIfAny();
        };
        const showCustomIfAny = () => {
            if (!isMounted) return;
            if (settings.customMsg && durations.notification > 0) {
                setDisplayMode('custom');
                timeoutId = setTimeout(showHadith, durations.notification);
            } else showHadith();
        };
        showHadith();
        return () => { 
            isMounted = false;
            if (timeoutId) clearTimeout(timeoutId); 
        };
    }, [vaktiSot?.Date, settings.customMsg, settings.showQr, durations]);

    // Handle Keyboard & Remote Input (Memoized for stability)
    const handleKeyDown = useCallback((e) => {
        // Ignore hotkeys if user is typing in an input field
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
        if (isInput) return;

        const key = e.key.toLowerCase();
        // Opening settings: S, M, or Enter/OK on remote
        if (key === 's' || key === 'm' || key === 'enter' || key === 'select') {
            setShowSettings(true);
        }
        if (key === 'r') window.location.reload();
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown, { passive: true });
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Screen Wake Lock: Prevent TV from going to sleep (Hardened Heartbeat Version)
    useEffect(() => {
        let wakeLock = null;
        let isActive = true;
        let retryTimeout = null;
        let heartbeatInterval = null;

        const requestWakeLock = async () => {
            if (!isActive || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
            try {
                if (wakeLock) {
                    await wakeLock.release().catch(() => {});
                    wakeLock = null;
                }
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => {
                    wakeLock = null;
                    if (isActive && document.visibilityState === 'visible') {
                        if (retryTimeout) clearTimeout(retryTimeout);
                        retryTimeout = setTimeout(requestWakeLock, 2000);
                    }
                });
            } catch (err) {
                if (isActive && document.visibilityState === 'visible') {
                    if (retryTimeout) clearTimeout(retryTimeout);
                    retryTimeout = setTimeout(requestWakeLock, 10000);
                }
            }
        };

        requestWakeLock();
        
        heartbeatInterval = setInterval(() => {
            if (isActive && document.visibilityState === 'visible' && !wakeLock) {
                requestWakeLock();
            }
        }, 30000);

        const handleVisibilityChange = () => { if (document.visibilityState === 'visible') requestWakeLock(); };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isActive = false;
            if (retryTimeout) clearTimeout(retryTimeout);
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLock) {
                wakeLock.release().catch(() => {});
                wakeLock = null;
            }
        };
    }, []);

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
        }, 180000); // 3 minutes

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

        return () => {
            if (audioCtx && audioCtx.state !== 'closed') {
                audioCtx.close().catch(() => {});
            }
        };
    }, []);

    const saveSettings = () => {
        setSettings(tempSettings);
        localStorage.setItem('tv_settings', JSON.stringify(tempSettings));
        setShowSettings(false);
        logEvent("Settings", "Save", tempSettings.appMode);
        // Explicitly trigger update to next prayer to catch logic changes immediately
        setTimeout(updateNextPrayer, 0);
    };

    // Auto-save: commit changes when modal closes
    const handleCloseSettings = () => {
        saveSettings();
    };

    const triggerConfirm = (title, message, action) => {
        setConfirmConfig({ title, message, action });
        setShowConfirm(true);
    };

    const resetCategory = (category) => {
        let newSettings = { ...settings };
        
        if (category === 'identity') {
            newSettings = {
                ...newSettings,
                name: config.tvOptions.name,
                address: config.tvOptions.address,
                imamName: config.tvOptions.imamName
            };
        } else if (category === 'display') {
            newSettings = {
                ...newSettings,
                appMode: config.tvOptions.appMode,
                showQr: config.tvOptions.showQr,
                qrUrl: config.tvOptions.qrUrl,
                showSilenceWarning: config.tvOptions.showSilenceWarning,
                showFooter: config.tvOptions.showFooter,
                showQuranRadio: config.tvOptions.showQuranRadio
            };
        } else if (category === 'durations') {
            newSettings = { ...newSettings, durations: config.tvOptions.durations };
        } else if (category === 'ramazan') {
            newSettings = { ...newSettings, ramazan: config.ramazan };
        } else if (category === 'location') {
            newSettings = { 
                ...newSettings, 
                location: config.tvOptions.location,
                manualDreka: config.tvOptions.manualDreka,
                manualXhuma1: config.tvOptions.manualXhuma1,
                manualXhuma2: config.tvOptions.manualXhuma2,
                xhuma2Active: config.tvOptions.xhuma2Active,
                durations: {
                    ...newSettings.durations,
                    sabahuOffset: config.tvOptions.durations.sabahuOffset
                },
                iqamah: { ...config.tvOptions.iqamah }
            };
        } else if (category === 'message') {
            newSettings = { ...newSettings, customMsg: "" };
        }
        setSettings(newSettings);
        setTempSettings(newSettings);
        localStorage.setItem('tv_settings', JSON.stringify(newSettings));
        setShowConfirm(false);
        setShowSettings(false);
    };

    const resetToFactory = () => {
        const defaults = {
            ...config.tvOptions,
            ramazan: { ...config.ramazan },
            durations: { ...config.tvOptions.durations },
            customMsg: "",
            showQr: config.tvOptions.showQr,
            showFooter: config.tvOptions.showFooter,
            showSilenceWarning: config.tvOptions.showSilenceWarning,
            appMode: config.tvOptions.appMode,
            iqamah: { ...config.tvOptions.iqamah }
        };
        setSettings(defaults);
        setTempSettings(defaults);
        localStorage.setItem('tv_settings', JSON.stringify(defaults));
        setShowSettings(false);
        setShowConfirm(false);
        logEvent("Settings", "Factory Reset");
    };

    useEffect(() => {
        const refreshMin = settings.durations.hadithRefresh ?? config.tvOptions.durations.hadithRefresh;
        let isStillCurrent = true;
        
        const pickHadith = () => {
            const select = () => {
                if (!isStillCurrent || !haditheData.a?.length) return;
                const randomIdx = Math.floor(Math.random() * haditheData.a.length);
                const chosen = haditheData.a[randomIdx];
                if (!currentHadithRef.current) {
                    currentHadithRef.current = chosen;
                    setCurrentHadith(chosen);
                } else {
                    setNextHadith(chosen);
                }
            };
            if ('requestIdleCallback' in window) window.requestIdleCallback(select);
            else setTimeout(select, 0);
        };
        pickHadith();
        const interval = setInterval(() => { if (isStillCurrent) pickHadith(); }, refreshMin * 60000);
        return () => { 
            isStillCurrent = false;
            clearInterval(interval);
        };
    }, [settings.durations.hadithRefresh]);

    // --- BURN-IN PROTECTION: Night dimming only (pixel shift is a CSS animation in index.css) ---
    useEffect(() => {
        const checkDim = () => {
            const now = new Date();
            const minTani = now.getHours() * 60 + now.getMinutes();

            // Night Dimming: dims 60 minutes after Jacia/Teravia until 10m before Sabahu
            let dimStart = 23 * 60;
            let dimEnd = 4 * 60;

            if (vaktiSot) {
                const isR = settings.ramazan?.active;
                const jaciaTime = (isR && settings.ramazan?.kohaTeravise && settings.ramazan?.kohaTeravise !== "00:00")
                    ? settings.ramazan.kohaTeravise
                    : vaktiSot.Jacia;
                if (jaciaTime) dimStart = neMinuta(jaciaTime) + 60;
                if (vaktiSot.Sabahu) dimEnd = neMinuta(vaktiSot.Sabahu) - 10;
            }

            setIsNightDimmed(minTani >= dimStart || minTani < dimEnd);
        };

        checkDim();
        const interval = setInterval(checkDim, 60000);
        return () => clearInterval(interval);
    }, [vaktiSot, settings]);

    // --- MAINTENANCE & STABILITY: Smart Reload (4 times a day) ---
    useEffect(() => {
        let timerId;
        const checkReload = () => {
            const now = new Date();
            const currentPeriod = Math.floor(now.getHours() / 6);
            const nextPeriodHour = (currentPeriod + 1) * 6;
            const nextPeriodDate = new Date();
            nextPeriodDate.setHours(nextPeriodHour, Math.floor(Math.random() * 15), 0, 0); 
            
            const msUntilCheck = nextPeriodDate.getTime() - now.getTime();
            timerId = setTimeout(() => {
                const isNearPrayer = infoTani && infoTani.mbetur < 20;
                const isIdleMode = displayMode === 'hadith';
                if (isIdleMode && !isNearPrayer && navigator.onLine && !showSettings) window.location.reload();
                else setTimeout(checkReload, 5 * 60000);
            }, msUntilCheck);
        };
        checkReload();
        return () => { if (timerId) clearTimeout(timerId); };
    }, [displayMode, !!infoTani, showSettings]);

    // --- RECOVERY & STABILITY: Performance Monitoring (Self-Healing) ---
    // If the TV's performance drops significantly for 15s, it triggers a safe reload
    useEffect(() => {
        let lastTime = performance.now();
        let frames = 0;
        let warningTicks = 0;
        let pTimer;

        const monitor = (time) => {
            frames++;
            if (time >= lastTime + 1000) {
                const fps = Math.round((frames * 1000) / (time - lastTime));
                if (fps < 25 && !showSettings && document.visibilityState === 'visible') { // If bogged down below 25FPS
                    warningTicks++;
                    if (warningTicks > 15) { // 15 consecutive seconds of lag
                        const isNearPrayer = infoTani && infoTani.mbetur < 12;
                        if (!isNearPrayer && navigator.onLine) window.location.reload();
                    }
                } else { warningTicks = 0; }
                frames = 0;
                lastTime = time;
            }
            pTimer = requestAnimationFrame(monitor);
        };
        pTimer = requestAnimationFrame(monitor);
        return () => cancelAnimationFrame(pTimer);
    }, [!!infoTani, showSettings]);

    // Compute the active prayer dataset based on location
    const vaktet = useMemo(() => {
        return settings.location === 'al' ? vaktetAL : vaktetKS;
    }, [settings.location]);

    useEffect(() => {
        if (!Array.isArray(vaktet) || vaktet.length === 0) return;
        const perditeso = () => {
            const sot = new Date();
            const dite = sot.getDate();
            const muajiSot = sot.toLocaleString("en", { month: "short" });
            const rreshti = vaktet.find((v) => {
                const [d, m] = v.Date.split("-");
                return Number(d) === dite && m === muajiSot;
            }) ?? vaktet[0];

            // Update state ONLY if data has actually changed (prevents unnecessary re-renders)
            setVaktiSot(prev => {
                const isSame = prev && 
                    prev.Date === rreshti.Date && 
                    prev.Sabahu === rreshti.Sabahu && 
                    prev.Festat === rreshti.Festat &&
                    prev.Shenime === rreshti.Shenime;
                
                if (!isSame) saveToSafety('vaktiSot', rreshti);
                return isSame ? prev : rreshti;
            });
        };
        perditeso();
        const interval = setInterval(perditeso, 10 * 60000); // 10 minutes is enough to check for date transitions
        return () => clearInterval(interval);
    }, [vaktet]);

    const xhemati = useCallback((name) => {
        if (!vaktiSot) return null;
        if (settings.appMode === 'home') return vaktiSot[name] || null;

        const isR = settings.ramazan?.active;
        if (name === "Sabahu") {
            if (isR) return vaktiSot.Sabahu;
            if (vaktiSot.Lindja) {
                const [h, m] = vaktiSot.Lindja.split(":").map(Number);
                const total = h * 60 + m - (settings.durations?.sabahuOffset || 35);
                const o = Math.floor(total / 60);
                const min = ((total % 60) + 60) % 60;
                return `${String(o).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
            }
        }
        if (name === "Dreka" && vaktiSot?.Dreka) {
            if (settings.manualDreka && settings.manualDreka !== "00:00") return settings.manualDreka;
            const [h] = vaktiSot.Dreka.split(":").map(Number);
            return h < 12 ? "11:55" : "12:55";
        }
        if (name === "Xhuma1") return (settings.manualXhuma1 && settings.manualXhuma1 !== "00:00") ? settings.manualXhuma1 : xhemati("Dreka");
        if (name === "Xhuma2") return settings.manualXhuma2 === "00:00" ? null : settings.manualXhuma2;
        if (name === "Jacia" && vaktiSot?.Jacia) {
            if (isR && settings.ramazan?.kohaTeravise && settings.ramazan?.kohaTeravise !== "00:00") return settings.ramazan.kohaTeravise;
            return vaktiSot.Jacia;
        }
        if (name === "NamazNate") {
            return (isR && settings.appMode !== 'home' && settings.ramazan?.namazNate?.active) ? (settings.ramazan?.namazNate?.koha || "00:30") : null;
        }
        return vaktiSot?.[name] ?? null;
    }, [vaktiSot?.Date, settings.manualDreka, settings.manualXhuma1, settings.manualXhuma2, settings.ramazan?.active, settings.ramazan?.kohaTeravise, settings.ramazan?.namazNate?.active, settings.ramazan?.namazNate?.koha, settings.appMode, settings.durations?.sabahuOffset]);

    const updateNextPrayer = useCallback(() => {
        // Optimization: Don't run expensive calculations if page is hidden
        if (document.visibilityState === 'hidden' || !vaktiSot || !vaktet.length) return;

        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const isR = settings.ramazan?.active;
        const isHome = settings.appMode === 'home';
        const isFriday = now.getDay() === 5;

        const labelCtx = { isR, isHome, isFriday };
        
        const moments = [];
        let prayerKeys = isR ? ["Imsaku", "Sabahu", "Dreka", "Ikindia", "Akshami", "Jacia"] : ["Sabahu", "Dreka", "Ikindia", "Akshami", "Jacia"];

        if (isR && !isHome && settings.ramazan?.namazNate?.active) {
            prayerKeys.unshift("NamazNate");
        }

        if (isFriday && !isHome) {
            prayerKeys = prayerKeys.filter(k => k !== "Dreka");
            const sabIdx = prayerKeys.indexOf("Sabahu");
            prayerKeys.splice(sabIdx + 1, 0, "Xhuma1");
            if (settings.xhuma2Active) {
                prayerKeys.splice(sabIdx + 2, 0, "Xhuma2");
            }
        }

        prayerKeys.forEach(n => {
            const xh = xhemati(n);
            if (!xh) return;

            const isManualOrRamazanJacia = (n === "Jacia" && isR && !isHome && settings.ramazan?.kohaTeravise && settings.ramazan?.kohaTeravise !== "00:00");
            const isModifiedDreka = (n === "Dreka" && !isHome);
            const isSpecial = n === "Xhuma1" || n === "Xhuma2" || n === "NamazNate" || isManualOrRamazanJacia || isModifiedDreka;

            if (vaktiSot[n] && !isSpecial) moments.push({ id: n, kohe: vaktiSot[n], isXh: false });
            moments.push({ id: n, kohe: xh, isXh: true });
        });

        // Filter out duplicates (if JSON time and Xhemat time are identical)
        const uniqueMoments = moments.filter((m, i, self) => 
            i === self.findIndex(t => t.id === m.id && t.kohe === m.kohe)
        );

        let nextIdx = uniqueMoments.findIndex(m => neMinuta(m.kohe) > nowMin);
        let nextInfo;

        if (nextIdx === -1) {
            const tomIdx = vaktet.findIndex(v => v.Date === vaktiSot.Date) + 1;
            const tomorrowRow = vaktet[tomIdx] || vaktet[0];
            const hasNN = isR && settings.ramazan?.namazNate?.active && !isHome;
            const tomId = hasNN ? "NamazNate" : (isR ? "Imsaku" : "Sabahu");
            
            // Calculate tomorrow's start time
            let tomK;
            if (hasNN) tomK = settings.ramazan.namazNate.koha || "00:30";
            else if (isR) tomK = tomorrowRow.Imsaku;
            else {
                const [h, m] = tomorrowRow.Lindja.split(":").map(Number);
                const total = h * 60 + m - (settings.durations?.sabahuOffset || 35);
                tomK = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(((total % 60) + 60) % 60).padStart(2, "0")}`;
            }

            nextInfo = {
                tani: { id: "Jacia", label: getPrayerLabel("Jacia", labelCtx) },
                ardhshëm: { id: tomId, label: getPrayerLabel(tomId, labelCtx), kohe: tomK, isXh: true },
                mbetur: (24 * 60 - nowMin) + neMinuta(tomK)
            };
        } else {
            const currentMoment = nextIdx === 0 ? uniqueMoments[uniqueMoments.length - 1] : uniqueMoments[nextIdx - 1];
            let tani = { ...currentMoment, label: getPrayerLabel(currentMoment.id, labelCtx) };
            
            if (tani.id === "Sabahu" && vaktiSot.Lindja && nowMin >= neMinuta(vaktiSot.Lindja)) {
                tani = { id: "Lindja", label: "Lindja e Diellit", kohe: vaktiSot.Lindja };
            }

            nextInfo = {
                tani: tani,
                ardhshëm: { ...uniqueMoments[nextIdx], label: getPrayerLabel(uniqueMoments[nextIdx].id, labelCtx) },
                mbetur: neMinuta(uniqueMoments[nextIdx].kohe) - nowMin
            };
        }

        setInfoTani(prev => {
            const diffA = nextInfo.mbetur;
            const diffT = nextInfo.tani?.kohe ? nowMin - neMinuta(nextInfo.tani.kohe) : 999;
            const isSilenceMode = (diffA <= 5 && diffA >= 0) || (diffT >= 0 && diffT <= 2);

            if (prev && prev.mbetur === nextInfo.mbetur && prev.isSilenceMode === isSilenceMode && prev.ardhshëm?.id === nextInfo.ardhshëm?.id) {
                return prev;
            }
            return { ...nextInfo, isSilenceMode, nowMin };
        });
    }, [vaktiSot, vaktet, settings.appMode, settings.ramazan, settings.xhuma2Active, xhemati]);

    // Sync currentHadith state into ref so refresh timer can check it without being a dep
    useEffect(() => { currentHadithRef.current = currentHadith; }, [currentHadith]);

    useEffect(() => {
        updateNextPrayer();
        const interval = setInterval(updateNextPrayer, 10000);
        return () => clearInterval(interval);
    }, [updateNextPrayer]);

    const listaNamazeve = useMemo(() => {
        const isR = settings.ramazan?.active;
        const isHome = settings.appMode === 'home';
        const labelCtx = { isR, isHome, isFriday: new Date().getDay() === 5 };

        let list = [
            { id: "Sabahu", label: getPrayerLabel("Sabahu", labelCtx) },
            { id: "Dreka", label: getPrayerLabel("Dreka", labelCtx) },
            { id: "Ikindia", label: getPrayerLabel("Ikindia", labelCtx) },
            { id: "Akshami", label: getPrayerLabel("Akshami", labelCtx) },
            { id: "Jacia", label: getPrayerLabel("Jacia", labelCtx) },
        ];

        // On Friday in Mosque mode, Xhuma I replaces Dreka. Xhuma II is optional.
        if (labelCtx.isFriday && !isHome) {
            // Replace Dreka (index 1) with Xhuma 1
            list[1] = { id: "Xhuma1", label: getPrayerLabel("Xhuma1", labelCtx) };
            
            // If Xhuma 2 is ACTIVE, insert it right after
            if (settings.xhuma2Active) {
                list.splice(2, 0, { id: "Xhuma2", label: getPrayerLabel("Xhuma2", labelCtx) });
            }
        }

        if (isR) {
            list.unshift({ id: "Imsaku", label: getPrayerLabel("Imsaku", labelCtx) });
        }
        return list;
    }, [settings.ramazan, settings.appMode, settings.xhuma2Active, settings.manualXhuma1, settings.manualXhuma2, settings.manualDreka]);


    if (!vaktiSot) return <div className="h-screen bg-black flex items-center justify-center text-white text-3xl font-bold animate-pulse">Duke ngarkuar...</div>;

    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black z-[50] overflow-hidden">
            <div className="tv-container bg-black text-white font-sans overflow-hidden flex flex-col p-1 select-none"
                style={{
                    width: '1920px',
                    height: '1080px',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${Math.max(0.01, scale)})`,
                    transformOrigin: 'center center',
                    flexShrink: 0,
                    contain: 'layout style paint'
                }}>
                
                {/* Keepalive Video Element (Prevents sleep on Android TV browsers) */}
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    src="/silent.mp4"
                    style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
                />
                {/* Static CSS is in index.css */}

                {isNightDimmed && <div className="dimmed-overlay" style={{ opacity: 0.6 }} />}

                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
                    <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', willChange: 'transform' }} />
                    <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', willChange: 'transform' }} />
                </div>

                <ErrorBoundary fallback={<div className="h-20 bg-red-900/10 flex items-center justify-center text-zinc-500 uppercase font-black">Gabim në ngarkimin e Headerit</div>}>
                    <header className="mb-2 shrink-0 relative z-20">
                        {settings.appMode === 'mosque' ? (
                            <div className="flex justify-between items-center w-full px-10">
                                {/* Left Column: Location & Personnel */}
                                <div className="flex flex-col gap-0 flex-1 min-w-0">
                                    <p className="text-zinc-500 text-4xl font-black tracking-wider uppercase whitespace-nowrap overflow-visible">{settings.address}</p>
                                    <p className="text-zinc-600 text-2xl font-bold tracking-tight uppercase">
                                        Imami: <span className="text-zinc-400 font-black">{settings.imamName}</span>
                                    </p>

                                    <button
                                        onClick={() => setShowSettings(true)}
                                        className="flex items-center gap-4 px-8 py-3 w-fit rounded-[1.5rem] bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 group mt-1 shadow-2xl backdrop-blur-xl -ml-2"
                                    >
                                        <HiCog className="text-4xl text-zinc-600 group-hover:text-emerald-400 group-hover:rotate-180 transition-all duration-700" />
                                        <span className="text-xl font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-emerald-400">Konfiguro</span>
                                    </button>
                                </div>

                                {/* Center Column: Mosque Brand */}
                                <div className="flex-[2] flex justify-center px-0">
                                    <h1 className={`font-black text-emerald-500 tracking-tighter uppercase text-center leading-[0.8] whitespace-nowrap ${(settings.name || "").length > 20 ? 'text-5xl' : 'text-7xl'
                                        }`}>
                                        {settings.name}
                                    </h1>
                                </div>

                                {/* Right Column: Time & Calendar */}
                                <div className="flex-1 flex justify-end">
                                    <Clock />
                                </div>
                            </div>
                        ) : (
                            <div className="w-full relative px-10 py-6 flex justify-between items-start">
                                <div className="flex flex-col gap-4">
                                    <Clock mode="home_left" />
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setShowSettings(true)}
                                            className="flex items-center gap-4 px-8 py-3 w-fit rounded-[1.5rem] bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 group z-30 shadow-2xl backdrop-blur-xl"
                                        >
                                            <HiCog className="text-4xl text-zinc-600 group-hover:text-emerald-400 group-hover:rotate-180 transition-all duration-700" />
                                            <span className="text-xl font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-emerald-400">Konfiguro</span>
                                        </button>

                                        {settings.showQuranRadio && <QuranRadio />}
                                    </div>
                                </div>
                                <Clock mode="home_right" />
                            </div>
                        )}
                    </header>
                </ErrorBoundary>

                <ErrorBoundary fallback={<div className="flex-1 bg-black/40 flex items-center justify-center text-zinc-500 font-black uppercase">Gabim në shfaqjen e vaktisë</div>}>
                    <main className="flex-1 flex flex-col gap-6 min-h-0" style={{ contain: 'layout style paint' }}>
                        <div className="flex-[1.4] grid grid-cols-2 gap-6 relative z-10 min-h-0">
                            <NextPrayer infoTani={infoTani} ne24hFn={ne24h} formatDallimFn={formatDallim} settings={settings} />
                            <ActivityBox displayMode={displayMode} settings={settings} currentHadith={currentHadith} vaktiSot={vaktiSot} infoTani={infoTani} />
                        </div>
                        <PrayerGrid listaNamazeve={listaNamazeve} vaktiSot={vaktiSot} infoTani={infoTani} xhematiFn={xhemati} ne24hFn={ne24h} isRamazan={settings.ramazan?.active} settings={settings} />
                    </main>
                </ErrorBoundary>



                <SettingsModal
                    show={showSettings}
                    onClose={handleCloseSettings}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    tempSettings={tempSettings}
                    setTempSettings={setTempSettings}
                    saveSettings={saveSettings}
                    triggerConfirm={triggerConfirm}
                    resetCategory={resetCategory}
                    resetToFactory={resetToFactory}
                />

                <ConfirmDialog
                    show={showConfirm}
                    config={confirmConfig}
                    onCancel={() => setShowConfirm(false)}
                />

                <Analytics />
            </div>
        </div>
    );
}
