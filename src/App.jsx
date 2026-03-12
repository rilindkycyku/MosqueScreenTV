import { useEffect, useState, useMemo, useCallback } from 'react';
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

const PRAYERS = ["Sabahu", "Dreka", "Ikindia", "Akshami", "Jacia"];
const neMinuta = (ora) => {
    if (!ora) return 0;
    const [h, m] = ora.split(":").map(Number);
    return h * 60 + m;
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
    const [pixelShift, setPixelShift] = useState({ x: 0, y: 0 });
    const [isNightDimmed, setIsNightDimmed] = useState(false);
    const [nextHadith, setNextHadith] = useState(null);

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
        const raw = settings.durations || { hadith: 2, qr: 1, notification: 10, announcement: 1 };
        // Detect if value is already in milliseconds (> 1000) or minutes
        const toMs = (v) => {
            const num = Number(v) || 0;
            if (num > 1000) return num; // Old ms format
            return num * 60000;         // New minutes format
        };
        return {
            hadith: toMs(raw.hadith || 2),
            qr: toMs(raw.qr || 1),
            notification: toMs(raw.notification || 10),
            announcement: toMs(raw.announcement || 1)
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
            const key = e.key.toLowerCase();
            // Opening settings: S, M, or Enter/OK on remote
            if (key === 's' || key === 'm' || key === 'enter' || key === 'select') {
                setShowSettings(true);
            }
            if (key === 'r') window.location.reload();
            if (e.key === 'Escape') setShowSettings(false);
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
        const refreshMin = settings.durations.hadithRefresh || 60;
        const pickHadith = () => {
            if (haditheData.a?.length) {
                const randomIdx = Math.floor(Math.random() * haditheData.a.length);
                const chosen = haditheData.a[randomIdx];
                // Queue the next hadith to avoid interruption
                setNextHadith(prev => (!currentHadith ? null : chosen));
                if (!currentHadith) setCurrentHadith(chosen);
            }
        };
        pickHadith();
        const interval = setInterval(pickHadith, refreshMin * 60000);
        return () => clearInterval(interval);
    }, [settings.durations.hadithRefresh, currentHadith]);

    // --- BURN-IN PROTECTION & ENERGY SAVING ---
    useEffect(() => {
        const updateStability = () => {
            const now = new Date();
            const minTani = now.getHours() * 60 + now.getMinutes();

            setPixelShift({
                x: Math.floor(Math.random() * 3) - 1,
                y: Math.floor(Math.random() * 3) - 1
            });

            // Night Dimming: Dims 30 minutes after Jacia/Teravia until 10m before Sabahu
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

        updateStability();
        const interval = setInterval(updateStability, 60000);
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

        const getLabel = (id, xh) => {
            const isF = now.getDay() === 5;
            const isHome = settings.appMode === 'home';

            if (id === 'Imsaku') return (isR && isHome) ? "Syfyri" : (isR ? "Syfyri (Imsaku)" : "Imsaku");
            if (id === 'Akshami') return (isR && isHome) ? "Iftari" : (isR ? "Iftari (Akshami)" : "Akshami");
            if (id === 'Jacia' && isR) return isHome ? "Jacia" : "Teravia (Jacia)";
            if (id === 'Dreka' && isF) return "Xhumaja";
            if (id === 'NamazNate') return "Namaz i Natës";
            return id;
        };

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

                // Teravia/Jacia skip logic: home mode always shows Jacia
                const skipRawJacia = (n === "Jacia" && isR && settings.appMode !== 'home' && settings.ramazan?.kohaTeravise && settings.ramazan?.kohaTeravise !== "00:00");

                if (!skipRawJacia) {
                    moments.push({ id: n, kohe: vaktiSot[n], isXh: false });
                }

                if (xh) {
                    if (xh !== kohaPajisjes || skipRawJacia) {
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

            const isHome = settings.appMode === 'home';
            const hasNN = isR && settings.ramazan?.namazNate?.active && !isHome;
            const tomId = hasNN ? "NamazNate" : (isR ? "Imsaku" : "Sabahu");
            const tomK = hasNN ? (settings.ramazan?.namazNate?.koha || "00:30") : (isR ? tomorrowRow.Imsaku : tomXh);

            nextInfo = {
                tani: { id: "Jacia", label: getLabel("Jacia", true) },
                ardhshëm: { id: tomId, label: getLabel(tomId, true), kohe: tomK, isXh: true },
                mbetur: (24 * 60 - nowMin) + neMinuta(tomK)
            };
        } else if (nextIdx === 0) {
            const idxS = vaktet.findIndex(v => v.Date === vaktiSot.Date);
            const yesterday = idxS > 0 ? vaktet[idxS - 1] : vaktet[vaktet.length - 1];
            nextInfo = {
                tani: { id: "Jacia", label: getLabel("Jacia", true), kohe: yesterday.Jacia },
                ardhshëm: { ...moments[0], label: getLabel(moments[0].id, moments[0].isXh) },
                mbetur: neMinuta(moments[0].kohe) - nowMin
            };
        } else {
            let tani = { ...moments[nextIdx - 1], label: getLabel(moments[nextIdx - 1].id, moments[nextIdx - 1].isXh) };

            if (tani.id === "Sabahu" && vaktiSot.Lindja && nowMin >= neMinuta(vaktiSot.Lindja)) {
                tani = { id: "Lindja", label: "Lindja e Diellit", kohe: vaktiSot.Lindja };
            }

            nextInfo = {
                tani: tani,
                ardhshëm: { ...moments[nextIdx], label: getLabel(moments[nextIdx].id, moments[nextIdx].isXh) },
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

    useEffect(() => {
        updateNextPrayer();
        const interval = setInterval(updateNextPrayer, 10000);
        return () => clearInterval(interval);
    }, [updateNextPrayer]);

    const formatDallim = (min) => {
        if (min <= 0) return "0m";
        const o = Math.floor(min / 60);
        const m = min % 60;
        let res = "";
        if (o > 0) res += `${o}h `;
        if (m > 0 || o === 0) res += `${m}m`;
        return res.trim();
    };

    const ne24h = (ora) => {
        if (!ora) return "—";
        const [h, m] = ora.split(":").map(Number);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const listaNamazeve = useMemo(() => {
        const isR = settings.ramazan?.active;
        const isF = new Date().getDay() === 5;
        const isHome = settings.appMode === 'home';

        const getPrayerLabel = (id) => {
            if (id === 'Imsaku') return (isR && isHome) ? "Syfyri" : (isR ? "Syfyri (Imsaku)" : "Imsaku");
            if (id === 'Akshami') return (isR && isHome) ? "Iftari" : (isR ? "Iftari (Akshami)" : "Akshami");
            if (id === 'Jacia' && isR) return isHome ? "Jacia" : "Teravia (Jacia)";
            if (id === 'Dreka' && isF) return "Xhumaja";
            if (id === 'NamazNate') return "Namaz i Natës";
            return id;
        };

        let list = [
            { id: "Sabahu", label: getPrayerLabel("Sabahu") },
            { id: "Dreka", label: getPrayerLabel("Dreka") },
            { id: "Ikindia", label: getPrayerLabel("Ikindia") },
            { id: "Akshami", label: getPrayerLabel("Akshami") },
            { id: "Jacia", label: getPrayerLabel("Jacia") },
        ];

        if (isR) {
            list.unshift({ id: "Imsaku", label: getPrayerLabel("Imsaku") });
        }
        return list;
    }, [settings.ramazan?.active, settings.appMode, settings.ramazan?.namazNate?.active]);


    if (!vaktiSot) return <div className="h-screen bg-black flex items-center justify-center text-white text-3xl font-bold animate-pulse">Duke ngarkuar...</div>;

    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black z-[50] overflow-hidden">
            <div className="tv-container bg-black text-white font-sans overflow-hidden flex flex-col pt-1 pb-4 px-8 select-none"
                style={{
                    width: '1920px',
                    height: '1080px',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${Math.max(0.01, scale)}) translate(${pixelShift.x}px, ${pixelShift.y}px)`,
                    transformOrigin: 'center center',
                    flexShrink: 0,
                    transition: 'transform 0.5s ease-out',
                    contain: 'strict'
                }}>
                <style>
                    {`
                        body::before { display: none !important; }
                        ::-webkit-scrollbar { display: none; }
                        @keyframes slide-up { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; will-change: transform, opacity; }
                        .glass-input { background: rgba(0, 0, 0, 0.4); border: 2px solid rgba(255, 255, 255, 0.05); border-radius: 1.25rem; }
                        /* Optimized for TV performance: Static visuals are safer than infinite filters */
                        * { text-rendering: auto; transform: translateZ(0); backface-visibility: hidden; }
                        .tv-container { -webkit-font-smoothing: antialiased; transform: translateZ(0); backface-visibility: hidden; will-change: transform, opacity; }
                        .next-prayer-box, .activity-box, .prayer-grid { will-change: transform; transform: translateZ(0); }
                        .dimmed-overlay { pointer-events: none; position: fixed; inset: 0; background: black; transition: opacity 2s ease; z-index: 9999; }
                        .shadow-premium { box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                    `}
                </style>

                {isNightDimmed && <div className="dimmed-overlay" style={{ opacity: 0.6 }} />}

                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
                    <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', willChange: 'transform' }} />
                    <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', willChange: 'transform' }} />
                </div>

                <header className="mb-4 shrink-0 relative z-20">
                    {settings.appMode === 'mosque' ? (
                        <div className="flex justify-between items-center w-full px-2">
                            {/* Left Column: Location & Personnel */}
                            <div className="flex flex-col gap-0 flex-1 min-w-0">
                                <p className="text-zinc-500 text-4xl font-black tracking-wider uppercase whitespace-nowrap overflow-visible">{settings.address}</p>
                                <p className="text-zinc-600 text-2xl font-bold tracking-tight uppercase">
                                    Imami: <span className="text-zinc-400 font-black">{settings.imamName}</span>
                                </p>

                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="flex items-center gap-4 px-8 py-3 w-fit rounded-[1.5rem] bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 group mt-4 shadow-2xl backdrop-blur-xl"
                                >
                                    <HiCog className="text-4xl text-zinc-600 group-hover:text-emerald-400 group-hover:rotate-180 transition-all duration-700" />
                                    <span className="text-xl font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-emerald-400">Konfiguro</span>
                                </button>
                            </div>

                            {/* Center Column: Mosque Brand */}
                            <div className="flex-[2] flex justify-center px-4">
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

                <main className="flex-1 flex flex-col gap-4 min-h-0" style={{ contain: 'layout style paint' }}>
                    <div className="flex-[1.4] grid grid-cols-2 gap-8 relative z-10 min-h-0">
                        <NextPrayer infoTani={infoTani} ne24hFn={ne24h} formatDallimFn={formatDallim} settings={settings} />
                        <ActivityBox displayMode={displayMode} settings={settings} currentHadith={currentHadith} vaktiSot={vaktiSot} infoTani={infoTani} />
                    </div>
                    <PrayerGrid listaNamazeve={listaNamazeve} vaktiSot={vaktiSot} infoTani={infoTani} xhematiFn={xhemati} ne24hFn={ne24h} isRamazan={settings.ramazan?.active} settings={settings} />
                </main>

                {settings.appMode === 'mosque' && (
                    <footer className="mt-2 px-8 shrink-0">
                        <div className="w-full h-12 flex justify-between items-center bg-black/40 px-12 rounded-full border border-white/10 text-zinc-400 font-bold uppercase tracking-[0.2em] shadow-sm backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-2xl font-black">
                                © {new Date().getFullYear()} - <span className="text-emerald-500">Rilind Kyçyku</span>
                            </div>
                            <div className="flex items-center gap-2 text-2xl font-black whitespace-nowrap">
                                <span className="text-emerald-500">Mosque Screen TV</span>
                                <span className="text-zinc-600 mx-4">•</span>
                                <span className="text-emerald-500 tracking-wider">www.tv.rilindkycyku.dev</span>
                            </div>
                            <div className="flex items-center gap-4 text-2xl font-black">
                                <span className="text-emerald-500 uppercase tracking-wider">www.rilindkycyku.dev</span>
                            </div>
                        </div>
                    </footer>
                )}

                <SettingsModal
                    show={showSettings}
                    onClose={() => setShowSettings(false)}
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
