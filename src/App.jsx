import { useEffect, useState, useMemo } from 'react';
import { HiCog } from "react-icons/hi";
import vaktet from './data/vaktet-e-namazit.json';
import config from './data/config.json';
import haditheData from './data/hadithe.json';
import { Analytics } from "@vercel/analytics/react";

// Components
import SettingsModal from './components/SettingsModal/SettingsModal';
import ConfirmDialog from './components/ConfirmDialog/ConfirmDialog';
import Clock from './components/Display/Clock';
import PrayerGrid from './components/Display/PrayerGrid';
import NextPrayer from './components/Display/NextPrayer';
import ActivityBox from './components/Display/ActivityBox';

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

    // Updated Display Cycle: 
    useEffect(() => {
        let timeoutId;
        const showCustom = () => {
            if (settings.customMsg) {
                setDisplayMode('custom');
                timeoutId = setTimeout(showHadith, settings.durations.notification);
            } else { showHadith(); }
        };
        const showHadith = () => {
            setDisplayMode('hadith');
            const duration = settings.durations.hadith || 120000;
            if (settings.durations.qr > 0) timeoutId = setTimeout(showQR, duration);
            else timeoutId = setTimeout(showMsgIfAny, duration);
        };
        const showQR = () => {
            setDisplayMode('qr');
            timeoutId = setTimeout(showMsgIfAny, settings.durations.qr);
        };
        const showMsgIfAny = () => {
            const hasMessage = vaktiSot?.Festat || vaktiSot?.Shenime;
            if (hasMessage && settings.durations.announcement > 0) {
                setDisplayMode('message');
                timeoutId = setTimeout(settings.customMsg ? showCustom : showHadith, settings.durations.announcement);
            } else {
                if (settings.customMsg) showCustom(); else showHadith();
            }
        };
        if (settings.customMsg) showCustom(); else showHadith();
        return () => clearTimeout(timeoutId);
    }, [vaktiSot, settings]);

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

    // Daily Maintenance: Reload at 3 AM to clear TV memory leaks
    useEffect(() => {
        const checkReload = () => {
            const now = new Date();
            if (now.getHours() === 3 && now.getMinutes() === 0) {
                window.location.reload();
            }
        };
        const interval = setInterval(checkReload, 60000); // Check every minute
        return () => clearInterval(interval);
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
            newSettings = { ...newSettings, name: config.tvOptions.name, address: config.tvOptions.address, imamName: config.tvOptions.imamName, qrUrl: config.tvOptions.qrUrl };
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
        const defaults = { ...config.tvOptions, ramazan: config.ramazan, customMsg: "" };
        setSettings(defaults);
        setTempSettings(defaults);
        localStorage.setItem('tv_settings', JSON.stringify(defaults));
        setShowSettings(false);
        setShowConfirm(false);
    };


    useEffect(() => {
        const pickHadith = () => {
            if (haditheData.a?.length) {
                const randomIndex = Math.floor(Math.random() * haditheData.a.length);
                setCurrentHadith(haditheData.a[randomIndex]);
            }
        };
        pickHadith();
        const interval = setInterval(pickHadith, settings.durations.hadithRefresh || 3600000);
        return () => clearInterval(interval);
    }, [settings.durations.hadithRefresh]);

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
            setVaktiSot(rreshti);

            const neMinuta = (ora) => {
                if (!ora) return 0;
                const [h, m] = ora.split(":").map(Number);
                return h * 60 + m;
            };

            const xhemati_inner = (emri) => {
                if (!["Sabahu", "Dreka", "Ikindia", "Akshami", "Jacia"].includes(emri)) return null;
                if (emri === "Sabahu" && rreshti) {
                    if (settings.ramazan?.active) return rreshti.Sabahu;
                    if (rreshti.Lindja) {
                        const [h, m] = rreshti.Lindja.split(":").map(Number);
                        const total = h * 60 + m - 40;
                        const o = Math.floor(total / 60);
                        const min = ((total % 60) + 60) % 60;
                        return `${String(o).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
                    }
                }
                if (emri === "Dreka" && rreshti?.Dreka) {
                    const eshteXhuma = new Date().getDay() === 5;
                    const [h, m] = rreshti.Dreka.split(":").map(Number);
                    const minAdhan = h * 60 + m;
                    if (eshteXhuma && minAdhan >= 12 * 60) return "13:00";
                    const oraTjeter = Math.ceil(minAdhan / 60) * 60;
                    const o = Math.floor(oraTjeter / 60);
                    return `${String(o).padStart(2, "0")}:00`;
                }
                if (emri === "Jacia" && rreshti?.Jacia) {
                    const tvTime = settings.ramazan?.kohaTeravise;
                    const isBlankOrZero = !tvTime || tvTime === "00:00" || tvTime.replace(/[^0-9]/g, '') === "0000";
                    if (settings.ramazan?.active && !isBlankOrZero) return tvTime;
                    return rreshti.Jacia;
                }
                return rreshti?.[emri] ?? null;
            };

            const getLabel = (id) => {
                if (id === 'Imsaku' && settings.ramazan?.active) return "Syfyri (Imsaku)";
                if (id === 'Akshami' && settings.ramazan?.active) return "Iftari (Akshami)";
                if (id === 'Jacia' && settings.ramazan?.active) return "Teravia (Jacia)";
                return id;
            };

            const moments = [];
            const namazet = ["Imsaku", "Sabahu", "Dreka", "Ikindia", "Akshami", "Jacia"];
            namazet.forEach(n => {
                if (rreshti[n]) {
                    moments.push({ id: n, label: getLabel(n), kohe: rreshti[n] });
                    const xh = xhemati_inner(n);
                    if (xh) moments.push({ id: n, label: `${n} (xhemat)`, kohe: xh });
                }
            });

            const tani = new Date();
            const minTani = tani.getHours() * 60 + tani.getMinutes();
            let nextIdx = moments.findIndex((m) => neMinuta(m.kohe) > minTani);

            if (nextIdx === -1) {
                const idxSot = vaktet.findIndex((v) => v.Date === rreshti.Date);
                const neser = vaktet[idxSot + 1] ?? vaktet[0];
                setInfoTani({ tani: { id: "Jacia", label: "Jacia" }, ardhshëm: { id: "Sabahu", label: "Sabahu", kohe: neser.Sabahu }, mbetur: (24 * 60 - minTani) + neMinuta(neser.Sabahu) });
                return;
            }
            if (nextIdx === 0) {
                const idxSot = vaktet.findIndex((v) => v.Date === rreshti.Date);
                const dje = idxSot > 0 ? vaktet[idxSot - 1] : vaktet[vaktet.length - 1];
                setInfoTani({ tani: { id: "Jacia", label: "Jacia", kohe: dje.Jacia }, ardhshëm: moments[0], mbetur: neMinuta(moments[0].kohe) - minTani });
                return;
            }
            setInfoTani((prev) => {
                const newState = { tani: moments[nextIdx - 1], ardhshëm: moments[nextIdx], mbetur: neMinuta(moments[nextIdx].kohe) - minTani };
                if (JSON.stringify(prev) === JSON.stringify(newState)) return prev;
                return newState;
            });
        };
        perditeso();
        const interval = setInterval(perditeso, 10000); // 10 seconds check is plenty for logic
        return () => clearInterval(interval);
    }, [vaktiSot, settings.ramazan]);

    const formatDallim = (min) => {
        if (min <= 0) return "0 minuta";
        const o = Math.floor(min / 60);
        const m = min % 60;
        let result = "";
        if (o > 0) result += `${o} orë${m > 0 ? ' e ' : ''}`;
        if (m > 0) result += `${m} ${m === 1 ? 'minutë' : 'minuta'}`;
        return result || "0 minuta";
    };

    const ne24h = (ora24) => {
        if (!ora24) return "—";
        const [h, m] = ora24.split(":").map(Number);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const xhemati = (emri) => {
        if (!vaktiSot) return null;
        if (emri === "Sabahu" && vaktiSot) {
            if (settings.ramazan?.active) return vaktiSot.Sabahu;
            if (vaktiSot.Lindja) {
                const [h, m] = vaktiSot.Lindja.split(":").map(Number);
                const total = h * 60 + m - 40;
                const o = Math.floor(total / 60);
                const min = ((total % 60) + 60) % 60;
                return `${String(o).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
            }
        }
        if (emri === "Dreka" && vaktiSot?.Dreka) {
            const eshteXhuma = new Date().getDay() === 5;
            const [h, m] = vaktiSot.Dreka.split(":").map(Number);
            const minAdhan = h * 60 + m;
            if (eshteXhuma && minAdhan >= 12 * 60) return "13:00";
            const oraTjeter = Math.ceil(minAdhan / 60) * 60;
            const o = Math.floor(oraTjeter / 60);
            return `${String(o).padStart(2, "0")}:00`;
        }
        if (emri === "Jacia" && vaktiSot?.Jacia) {
            const tvTime = settings.ramazan?.kohaTeravise;
            const isBlankOrZero = !tvTime || tvTime === "00:00" || tvTime.replace(/[^0-9]/g, '') === "0000";
            if (settings.ramazan?.active && !isBlankOrZero) return tvTime;
            return vaktiSot.Jacia;
        }
        return vaktiSot?.[emri] ?? null;
    };

    const listaNamazeve = useMemo(() => [
        { id: "Imsaku", label: settings.ramazan?.active ? "Syfyri (Imsaku)" : "Imsaku" },
        { id: "Sabahu", label: "Sabahu" },
        { id: "Dreka", label: "Dreka" },
        { id: "Ikindia", label: "Ikindia" },
        { id: "Akshami", label: settings.ramazan?.active ? "Iftari (Akshami)" : "Akshami" },
        { id: "Jacia", label: settings.ramazan?.active ? "Teravia (Jacia)" : "Jacia" },
    ], [settings.ramazan]);


    if (!vaktiSot) return <div className="h-screen bg-black flex items-center justify-center text-white text-3xl font-bold animate-pulse">Duke ngarkuar...</div>;

    return (
        <div className="tv-container h-screen bg-black text-white font-sans overflow-hidden flex flex-col p-8 select-none relative">
            <Analytics />
            <style>
                {`
                    body::before { display: none !important; }
                    ::-webkit-scrollbar { width: 8px; }
                    ::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
                    ::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.3); border-radius: 4px; }
                    ::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,0.5); }
                    @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    .animate-slide-up { animation: slide-up 0.4s ease-out forwards; will-change: transform, opacity; }
                    .glass-input { background: rgba(0, 0, 0, 0.4); border: 2px solid rgba(255, 255, 255, 0.05); border-radius: 1.25rem; transition: border-color 0.3s ease, background-color 0.3s ease; }
                    .glass-input:focus { border-color: #10b981; background: rgba(0, 0, 0, 0.6); box-shadow: 0 0 20px rgba(16, 185, 129, 0.1); }
                    .animate-pulse { will-change: opacity; }
                `}
            </style>

            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', willChange: 'transform' }} />
                <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', willChange: 'transform' }} />
            </div>

            <button onClick={() => setShowSettings(true)} className="absolute top-0 right-0 w-32 h-32 flex items-start justify-end p-6 bg-transparent opacity-0 hover:opacity-100 transition-opacity z-[100] cursor-pointer">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-zinc-400"><HiCog className="text-2xl" /></div>
            </button>

            <header className="grid grid-cols-3 items-center mb-8 shrink-0">
                <div className="flex flex-col gap-2">
                    <p className="text-zinc-400 text-4xl font-black tracking-widest uppercase truncate">{settings.address}</p>
                    <p className="text-zinc-500 text-3xl font-bold tracking-wide">Imami: <span className="text-zinc-300">{settings.imamName}</span></p>
                </div>
                <div className="text-center flex flex-col items-center justify-center">
                    <h1 className="text-7xl font-black text-emerald-400 tracking-tighter uppercase whitespace-nowrap drop-shadow-2xl">{settings.name}</h1>
                </div>
                <Clock />
            </header>

            <main className="flex-1 flex flex-col gap-6 min-h-0">
                <div className="flex-[1.2] grid grid-cols-2 gap-8 relative z-10 min-h-0">
                    <NextPrayer infoTani={infoTani} ne24hFn={ne24h} formatDallimFn={formatDallim} />
                    <ActivityBox displayMode={displayMode} settings={settings} currentHadith={currentHadith} vaktiSot={vaktiSot} />
                </div>
                <PrayerGrid listaNamazeve={listaNamazeve} vaktiSot={vaktiSot} infoTani={infoTani} xhematiFn={xhemati} ne24hFn={ne24h} />
            </main>

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
    );
}
