import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { HiCog } from "react-icons/hi";
import vaktetKS from './data/vaktet-e-namazit.json';
import vaktetAL from './data/vaktet-e-namazit-al.json';
import config from './data/config.json';
import haditheData from './data/hadithe.json';
// Components
import SettingsModal from './components/SettingsModal/SettingsModal';
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog';
import QuranRadio from './components/Display/QuranRadio';
import Clock from './components/Display/Clock';
import PrayerGrid from './components/Display/PrayerGrid';
import NextPrayer from './components/Display/NextPrayer';
import ActivityBox from './components/Display/ActivityBox';
// Vercel Analytics
import { Analytics } from '@vercel/analytics/react';

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
    if (id === 'Imsaku') return (isR && isHome) ? "Syfyri" : (isR ? "Syfyri (Imsaku)" : "Imsaku");
    if (id === 'Akshami') return (isR && isHome) ? "Iftari" : (isR ? "Iftari (Akshami)" : "Akshami");
    if (id === 'Jacia' && isR) return isHome ? "Jacia" : "Teravia (Jacia)";
    if (id === 'Dreka' && isFriday && !isHome) return "Xhumaja";
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
        // Detect if value is already in milliseconds (> 1000) or minutes
        const toMs = (v) => {
            const num = Number(v) || 0;
            if (num > 1000) return num; // Old ms format
            return num * 60000;         // New minutes format
        };
        return {
            hadith: toMs(raw.hadith ?? config.tvOptions.durations.hadith),
            qr: toMs(raw.qr ?? config.tvOptions.durations.qr),
            notification: toMs(raw.notification ?? config.tvOptions.durations.notification),
            announcement: toMs(raw.announcement ?? config.tvOptions.durations.announcement)
        };
    }, [settings.durations]);

    // --- DISPLAY CYCLE CONTROL ---
    useEffect(() => {
        let timeoutId;
        const showHadith = () => {
            setDisplayMode('hadith');
            // Seamless Hadith Refresh: If we have a queued hadith, swap it now while rotation is happening
            if (nextHadith) {
                setCurrentHadith(nextHadith);
                setNextHadith(null);
            }
            const duration = settings.customMsg ? Math.min(durations.hadith, 30000) : durations.hadith;
            if (settings.showQr !== false && durations.qr > 0) timeoutId = setTimeout(showQR, duration);
            else timeoutId = setTimeout(showMsgIfAny, duration);
        };
        const showQR = () => {
            setDisplayMode('qr');
            const duration = settings.customMsg ? Math.min(durations.qr, 15000) : durations.qr;
            timeoutId = setTimeout(showMsgIfAny, duration);
        };
        const showMsgIfAny = () => {
            const hasMsg = vaktiSot?.Festat || vaktiSot?.Shenime;
            if (hasMsg && durations.announcement > 0) {
                setDisplayMode('message');
                timeoutId = setTimeout(showCustomIfAny, durations.announcement);
            } else showCustomIfAny();
        };
        const showCustomIfAny = () => {
            if (settings.customMsg && durations.notification > 0) {
                setDisplayMode('custom');
                timeoutId = setTimeout(showHadith, durations.notification);
            } else showHadith();
        };
        showHadith();
        return () => clearTimeout(timeoutId);
    }, [vaktiSot?.Date, settings.customMsg, settings.showQr, durations]);

    // Handle Keyboard & Remote Input
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore hotkeys if user is typing in an input field
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
            if (isInput) return;

            const key = e.key.toLowerCase();
            // Opening settings: S, M, or Enter/OK on remote
            if (key === 's' || key === 'm' || key === 'enter' || key === 'select') {
                setShowSettings(true);
            }
            if (key === 'r') window.location.reload();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Screen Wake Lock: Prevent TV from going to sleep (Optimized for low-end TVs)
    useEffect(() => {
        let wakeLock = null;
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                    wakeLock.addEventListener('release', () => {
                        if (document.visibilityState === 'visible') requestWakeLock();
                    });
                }
            } catch (err) { }
        };

        requestWakeLock();

        const handleVisibilityChange = () => { if (document.visibilityState === 'visible') requestWakeLock(); };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            wakeLock?.release();
        };
    }, []);

    const saveSettings = () => {
        setSettings(tempSettings);
        localStorage.setItem('tv_settings', JSON.stringify(tempSettings));
        setShowSettings(false);
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
                imamName: config.tvOptions.imamName,
                qrUrl: config.tvOptions.qrUrl,
                durations: {
                    ...newSettings.durations,
                    sabahuOffset: config.tvOptions.durations.sabahuOffset
                },
                showQr: config.tvOptions.showQr,
                showFooter: config.tvOptions.showFooter,
                showSilenceWarning: config.tvOptions.showSilenceWarning
            };
        } else if (category === 'durations') {
            newSettings = { ...newSettings, durations: config.tvOptions.durations };
        } else if (category === 'ramazan') {
            newSettings = { ...newSettings, ramazan: config.ramazan };
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
            appMode: config.tvOptions.appMode
        };
        setSettings(defaults);
        setTempSettings(defaults);
        localStorage.setItem('tv_settings', JSON.stringify(defaults));
        setShowSettings(false);
        setShowConfirm(false);
    };

    useEffect(() => {
        const refreshMin = settings.durations.hadithRefresh ?? config.tvOptions.durations.hadithRefresh;
        const pickHadith = () => {
            if (haditheData.a?.length) {
                const randomIdx = Math.floor(Math.random() * haditheData.a.length);
                const chosen = haditheData.a[randomIdx];
                if (!currentHadithRef.current) {
                    // First load: set immediately
                    currentHadithRef.current = chosen;
                    setCurrentHadith(chosen);
                } else {
                    // Queue for seamless swap at the start of the next display cycle
                    setNextHadith(chosen);
                }
            }
        };
        pickHadith();
        const interval = setInterval(pickHadith, refreshMin * 60000);
        return () => clearInterval(interval);
        // Only re-run if refresh interval changes, not on every hadith change
    }, [settings.durations.hadithRefresh]);

    // --- BURN-IN PROTECTION: Night dimming only (pixel shift is a CSS animation in index.css) ---
    useEffect(() => {
        const checkDim = () => {
            const now = new Date();
            const minTani = now.getHours() * 60 + now.getMinutes();

            // Night Dimming: dims 30 minutes after Jacia/Teravia until 10m before Sabahu
            let dimStart = 23 * 60;
            let dimEnd = 4 * 60;

            if (vaktiSot) {
                const isR = settings.ramazan?.active;
                const jaciaTime = (isR && settings.ramazan?.kohaTeravise && settings.ramazan?.kohaTeravise !== "00:00")
                    ? settings.ramazan.kohaTeravise
                    : vaktiSot.Jacia;
                if (jaciaTime) dimStart = neMinuta(jaciaTime) + 30;
                if (vaktiSot.Sabahu) dimEnd = neMinuta(vaktiSot.Sabahu) - 10;
            }

            setIsNightDimmed(minTani >= dimStart || minTani < dimEnd);
        };

        checkDim();
        const interval = setInterval(checkDim, 60000);
        return () => clearInterval(interval);
    }, [vaktiSot, settings]);

    // --- MAINTENANCE & STABILITY ---
    useEffect(() => {
        let timerId;
        let retryTimerId;

        const scheduleReload = () => {
            const now = new Date();
            const nightTarget = new Date();
            const dayTarget = new Date();

            // 1. Night Reload (1 AM - 4 AM)
            nightTarget.setHours(Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 60), 0, 0);
            if (now > nightTarget) nightTarget.setDate(nightTarget.getDate() + 1);

            // 2. Daytime Reload (10 AM - 5 PM)
            dayTarget.setHours(Math.floor(Math.random() * 8) + 10, Math.floor(Math.random() * 60), 0, 0);
            if (now > dayTarget) dayTarget.setDate(dayTarget.getDate() + 1);

            const nextTarget = nightTarget < dayTarget ? nightTarget : dayTarget;
            const msUntilTrigger = nextTarget.getTime() - now.getTime();

            timerId = setTimeout(() => {
                if (navigator.onLine) window.location.reload();
                else {
                    retryTimerId = setTimeout(() => {
                        if (navigator.onLine) window.location.reload();
                        else scheduleReload();
                    }, 30 * 60000);
                }
            }, msUntilTrigger);
        };

        scheduleReload();
        return () => {
            clearTimeout(timerId);
            clearTimeout(retryTimerId);
        };
    }, []);

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

            // Update state if data has changed (even on the same day)
            setVaktiSot(prev => (JSON.stringify(prev) === JSON.stringify(rreshti) ? prev : rreshti));
        };
        perditeso();
        const interval = setInterval(perditeso, 10000);
        return () => clearInterval(interval);
    }, [vaktet]);

    const xhemati = useCallback((name) => {
        if (!vaktiSot) return null;
        if (settings.appMode === 'home' && name !== "NamazNate") return vaktiSot[name];

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
            const now = new Date();
            // Automatically switch between 12:55 (DST) and 11:55 (Standard Time)
            const isDST = now.getTimezoneOffset() < new Date(now.getFullYear(), 0, 1).getTimezoneOffset();
            return isDST ? "12:55" : "11:55";
        }
        if (name === "Jacia" && vaktiSot?.Jacia) {
            if (isR && settings.ramazan?.kohaTeravise && settings.ramazan?.kohaTeravise !== "00:00") return settings.ramazan.kohaTeravise;
            return vaktiSot.Jacia;
        }
        if (name === "NamazNate") {
            return (isR && settings.appMode !== 'home' && settings.ramazan?.namazNate?.active) ? (settings.ramazan?.namazNate?.koha || "00:30") : null;
        }
        return vaktiSot?.[name] ?? null;
    }, [vaktiSot, settings]);

    const updateNextPrayer = useCallback(() => {
        if (!vaktiSot || !vaktet.length) return;

        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const isR = settings.ramazan?.active;
        const isHome = settings.appMode === 'home';

        const labelCtx = { isR, isHome, isFriday: now.getDay() === 5 };
        const getLabel = (id) => getPrayerLabel(id, labelCtx);

        const moments = [];
        let prayerKeys = ["Sabahu", "Dreka", "Ikindia", "Akshami", "Jacia"];
        if (isR) prayerKeys.unshift("Imsaku");

        // NamazNate only for Mosque mode if active
        if (isR && settings.appMode !== 'home' && settings.ramazan?.namazNate?.active) {
            prayerKeys.unshift("NamazNate");
        }

        prayerKeys.forEach(n => {
            const kohaPajisjes = n === "NamazNate" ? (settings.ramazan?.namazNate?.koha || "00:30") : vaktiSot[n];
            if (kohaPajisjes) {
                const xh = xhemati(n);

                // Skip logic for specific prayers
                const skipRawJacia = (n === "Jacia" && isR && settings.appMode !== 'home' && settings.ramazan?.kohaTeravise && settings.ramazan?.kohaTeravise !== "00:00");
                const skipJsonDreka = (n === "Dreka" && xh && xh !== kohaPajisjes && !isHome);

                if (!skipRawJacia && !skipJsonDreka) {
                    moments.push({ id: n, kohe: vaktiSot[n], isXh: false });
                }

                if (xh) {
                    if (xh !== kohaPajisjes || skipRawJacia || skipJsonDreka) {
                        moments.push({ id: n, kohe: xh, isXh: true });
                    }
                }
            }
        });

        let nextIdx = moments.findIndex(m => neMinuta(m.kohe) > nowMin);
        let nextInfo;

        if (nextIdx === -1) {
            const tomIdx = vaktet.findIndex(v => v.Date === vaktiSot.Date) + 1;
            const tomorrowRow = vaktet[tomIdx] || vaktet[0];
            const tomXh = isR ? tomorrowRow.Sabahu : (tomorrowRow.Lindja ? (() => {
                const [h, m] = tomorrowRow.Lindja.split(":").map(Number);
                const total = h * 60 + m - (settings.durations?.sabahuOffset || 35);
                return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(((total % 60) + 60) % 60).padStart(2, "0")}`;
            })() : tomorrowRow.Sabahu);

            // isHome is already in scope from the outer useCallback
            const hasNN = isR && settings.ramazan?.namazNate?.active && !isHome;
            const tomId = hasNN ? "NamazNate" : (isR ? "Imsaku" : "Sabahu");
            const tomK = hasNN ? (settings.ramazan?.namazNate?.koha || "00:30") : (isR ? tomorrowRow.Imsaku : tomXh);

            nextInfo = {
                tani: { id: "Jacia", label: getLabel("Jacia") },
                ardhshëm: { id: tomId, label: getLabel(tomId), kohe: tomK, isXh: true },
                mbetur: (24 * 60 - nowMin) + neMinuta(tomK)
            };
        } else if (nextIdx === 0) {
            const idxS = vaktet.findIndex(v => v.Date === vaktiSot.Date);
            const yesterday = idxS > 0 ? vaktet[idxS - 1] : vaktet[vaktet.length - 1];
            nextInfo = {
                tani: { id: "Jacia", label: getLabel("Jacia"), kohe: yesterday.Jacia },
                ardhshëm: { ...moments[0], label: getLabel(moments[0].id) },
                mbetur: neMinuta(moments[0].kohe) - nowMin
            };
        } else {
            let tani = { ...moments[nextIdx - 1], label: getLabel(moments[nextIdx - 1].id) };

            if (tani.id === "Sabahu" && vaktiSot.Lindja && nowMin >= neMinuta(vaktiSot.Lindja)) {
                tani = { id: "Lindja", label: "Lindja e Diellit", kohe: vaktiSot.Lindja };
            }

            nextInfo = {
                tani: tani,
                ardhshëm: { ...moments[nextIdx], label: getLabel(moments[nextIdx].id) },
                mbetur: neMinuta(moments[nextIdx].kohe) - nowMin
            };
        }

        setInfoTani(prev => {
            const diffA = nextInfo.ardhshëm ? neMinuta(nextInfo.ardhshëm.kohe) - nowMin : 999;
            const diffT = nextInfo.tani?.kohe ? nowMin - neMinuta(nextInfo.tani.kohe) : 999;
            const isSilenceMode = (diffA <= 5 && diffA >= 0) || (diffT >= 0 && diffT <= 2);

            const updated = { ...nextInfo, isSilenceMode, nowMin };
            return JSON.stringify(prev) === JSON.stringify(updated) ? prev : updated;
        });
    }, [vaktiSot, settings, xhemati]);

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

        if (isR) {
            list.unshift({ id: "Imsaku", label: getPrayerLabel("Imsaku", labelCtx) });
        }
        return list;
    }, [settings.ramazan?.active, settings.appMode]);


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
                    contain: 'strict'
                }}>
                {/* Static CSS is in index.css */}

                {isNightDimmed && <div className="dimmed-overlay" style={{ opacity: 0.6 }} />}

                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
                    <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', willChange: 'transform' }} />
                    <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', willChange: 'transform' }} />
                </div>

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

                <main className="flex-1 flex flex-col gap-2 min-h-0" style={{ contain: 'layout style paint' }}>
                    <div className="flex-[1.4] grid grid-cols-2 gap-2 relative z-10 min-h-0">
                        <NextPrayer infoTani={infoTani} ne24hFn={ne24h} formatDallimFn={formatDallim} settings={settings} />
                        <ActivityBox displayMode={displayMode} settings={settings} currentHadith={currentHadith} vaktiSot={vaktiSot} infoTani={infoTani} />
                    </div>
                    <PrayerGrid listaNamazeve={listaNamazeve} vaktiSot={vaktiSot} infoTani={infoTani} xhematiFn={xhemati} ne24hFn={ne24h} isRamazan={settings.ramazan?.active} settings={settings} />
                </main>



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
