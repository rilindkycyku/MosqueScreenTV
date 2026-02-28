import { useEffect, useState, useMemo, useCallback } from 'react';
import { HiCog } from "react-icons/hi";
import vaktet from './data/vaktet-e-namazit.json';
import config from './data/config.json';
import haditheData from './data/hadithe.json';
// Components
import SettingsModal from './components/SettingsModal/SettingsModal';
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog';
import Clock from './components/Display/Clock';
import PrayerGrid from './components/Display/PrayerGrid';
import NextPrayer from './components/Display/NextPrayer';
import ActivityBox from './components/Display/ActivityBox';

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
            if (e.key === 'Escape') setShowSettings(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Screen Wake Lock: Prevent TV from going to sleep
    useEffect(() => {
        let wakeLock = null;
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                }
            } catch (err) {
                console.log(`${err.name}, ${err.message}`);
            }
        };

        requestWakeLock();

        const handleVisibilityChange = () => {
            if (wakeLock !== null && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

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
                showQr: config.tvOptions.showQr
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
            showQr: config.tvOptions.showQr
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
                setCurrentHadith(haditheData.a[randomIdx]);
            }
        };
        pickHadith();
        const interval = setInterval(pickHadith, refreshMin * 60000);
        return () => clearInterval(interval);
    }, [settings.durations.hadithRefresh]);

    // --- MAINTENANCE & STABILITY (STAGGERED) ---
    useEffect(() => {
        let timerId;
        let retryTimerId;
        const scheduleReload = () => {
            const now = new Date();
            const target = new Date();
            const randomHour = Math.floor(Math.random() * 3) + 1; // 1 AM to 3:59 AM
            const randomMinute = Math.floor(Math.random() * 60);
            target.setHours(randomHour, randomMinute, 0, 0);
            if (now > target) target.setDate(target.getDate() + 1);
            const msUntilTrigger = target.getTime() - now.getTime();
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

            setVaktiSot(prev => (prev?.Date === rreshti.Date ? prev : rreshti));
        };
        perditeso();
        const interval = setInterval(perditeso, 10000);
        return () => clearInterval(interval);
    }, []);

    const xhemati = useCallback((name) => {
        if (!vaktiSot) return null;
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
            if (new Date().getDay() === 5) return "12:55";
            return "11:55";
        }
        if (name === "Jacia" && vaktiSot?.Jacia) {
            if (isR && settings.ramazan?.kohaTeravise && settings.ramazan?.kohaTeravise !== "00:00") return settings.ramazan.kohaTeravise;
            return vaktiSot.Jacia;
        }
        return vaktiSot?.[name] ?? null;
    }, [vaktiSot, settings]);

    const updateNextPrayer = useCallback(() => {
        if (!vaktiSot || !vaktet.length) return;

        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        const isR = settings.ramazan?.active;

        const getLabel = (id, xh) => {
            const isF = now.getDay() === 5;
            let base = id;
            if (id === 'Imsaku' && isR) base = "Syfyri (Imsaku)";
            else if (id === 'Dreka' && isF) base = "Xhumaja";
            else if (id === 'Akshami' && isR) base = "Iftari (Akshami)";
            else if (id === 'Jacia' && isR) base = "Teravia (Jacia)";
            return base;
        };

        const moments = [];
        const PRAYER_KEYS = isR ? ["Imsaku", "Sabahu", "Dreka", "Ikindia", "Akshami", "Jacia"] : ["Sabahu", "Dreka", "Ikindia", "Akshami", "Jacia"];

        PRAYER_KEYS.forEach(n => {
            const xh = xhemati(n);
            const raw = vaktiSot[n];
            const displayTime = xh || raw;
            if (displayTime) {
                moments.push({ id: n, kohe: displayTime, isXh: !!xh });
            }
        });

        let nextIdx = moments.findIndex(m => neMinuta(m.kohe) > nowMin);
        let nextInfo;

        if (nextIdx === -1) {
            const tomorrowRow = vaktet[vaktet.findIndex(v => v.Date === vaktiSot.Date) + 1] || vaktet[0];
            const tomXh = isR ? tomorrowRow.Sabahu : (tomorrowRow.Lindja ? (() => {
                const [h, m] = tomorrowRow.Lindja.split(":").map(Number);
                const total = h * 60 + m - (settings.durations?.sabahuOffset || 35);
                return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(((total % 60) + 60) % 60).padStart(2, "0")}`;
            })() : tomorrowRow.Sabahu);

            nextInfo = {
                tani: { id: "Jacia", label: getLabel("Jacia", true) },
                ardhshëm: { id: isR ? "Imsaku" : "Sabahu", label: getLabel(isR ? "Imsaku" : "Sabahu", true), kohe: isR ? tomorrowRow.Imsaku : tomXh, isXh: true },
                mbetur: (24 * 60 - nowMin) + neMinuta(isR ? tomorrowRow.Imsaku : tomXh)
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
            nextInfo = {
                tani: { ...moments[nextIdx - 1], label: getLabel(moments[nextIdx - 1].id, moments[nextIdx - 1].isXh) },
                ardhshëm: { ...moments[nextIdx], label: getLabel(moments[nextIdx].id, moments[nextIdx].isXh) },
                mbetur: neMinuta(moments[nextIdx].kohe) - nowMin
            };
        }

        setInfoTani(prev => {
            const updated = { ...nextInfo, isSilenceMode: nextInfo.mbetur <= 5 && nextInfo.mbetur >= -2 };
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
        const list = [
            { id: "Sabahu", label: "Sabahu" },
            { id: "Dreka", label: isF ? "Xhumaja" : "Dreka" },
            { id: "Ikindia", label: "Ikindia" },
            { id: "Akshami", label: isR ? "Iftari (Akshami)" : "Akshami" },
            { id: "Jacia", label: isR ? "Teravia (Jacia)" : "Jacia" },
        ];
        if (isR) list.unshift({ id: "Imsaku", label: "Syfyri (Imsaku)" });
        return list;
    }, [settings.ramazan]);


    if (!vaktiSot) return <div className="h-screen bg-black flex items-center justify-center text-white text-3xl font-bold animate-pulse">Duke ngarkuar...</div>;

    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black z-[50] overflow-hidden">
            <div className="tv-container bg-black text-white font-sans overflow-hidden flex flex-col p-8 select-none"
                style={{
                    width: '1920px',
                    height: '1080px',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) scale(${Math.max(0.01, scale)})`,
                    transformOrigin: 'center center',
                    flexShrink: 0
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
                        .tv-container { -webkit-font-smoothing: antialiased; }
                        .shadow-premium { box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                    `}
                </style>

                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
                    <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', willChange: 'transform' }} />
                    <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', willChange: 'transform' }} />
                </div>

                <button onClick={() => setShowSettings(true)} className="absolute top-0 right-0 w-32 h-32 flex items-start justify-end p-6 bg-transparent opacity-0 hover:opacity-100 transition-opacity z-[100] cursor-pointer">
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-zinc-400"><HiCog className="text-2xl" /></div>
                </button>

                <header className="grid grid-cols-3 items-center mb-8 shrink-0" style={{ contain: 'layout style' }}>
                    <div className="flex flex-col gap-2">
                        <p className="text-zinc-400 text-3xl font-black tracking-widest uppercase truncate">{settings.address}</p>
                        <p className="text-zinc-500 text-2xl font-bold tracking-wide">Imami: <span className="text-zinc-300">{settings.imamName}</span></p>
                    </div>
                    <div className="text-center flex flex-col items-center justify-center">
                        <h1 className="text-6xl font-black text-emerald-400 tracking-tighter uppercase whitespace-nowrap">{settings.name}</h1>
                    </div>
                    <Clock />
                </header>

                <main className="flex-1 flex flex-col gap-6 min-h-0" style={{ contain: 'layout style paint' }}>
                    <div className="flex-[1.2] grid grid-cols-2 gap-8 relative z-10 min-h-0">
                        <NextPrayer infoTani={infoTani} ne24hFn={ne24h} formatDallimFn={formatDallim} />
                        <ActivityBox displayMode={displayMode} settings={settings} currentHadith={currentHadith} vaktiSot={vaktiSot} infoTani={infoTani} />
                    </div>
                    <PrayerGrid listaNamazeve={listaNamazeve} vaktiSot={vaktiSot} infoTani={infoTani} xhematiFn={xhemati} ne24hFn={ne24h} isRamazan={settings.ramazan?.active} />
                </main>

                <footer className="mt-4 flex justify-start items-center opacity-30 pl-6">
                    <div className="bg-white/5 px-4 py-2 rounded-full border border-white/5 text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                        Developed by <span className="text-emerald-500">Rilind Kycyku</span> • <span className="text-zinc-600">rilindkycyku.dev</span>
                    </div>
                </footer>

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
            </div>
        </div>
    );
}
