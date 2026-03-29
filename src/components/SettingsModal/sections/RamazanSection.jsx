import { useRef, useState, useEffect } from "react";
import { HiClock } from "react-icons/hi";
import { SectionHeader } from "./shared";

export default function RamazanSection({ settings, setSettings, triggerConfirm, onReset }) {
    const hourRef = useRef(null);
    const minRef = useRef(null);

    const fullTime = settings.ramazan?.kohaTeravise || "";
    const [initialH, initialM] = fullTime.includes(':') ? fullTime.split(':') : ["", ""];

    const [h, setH] = useState(initialH);
    const [m, setM] = useState(initialM);

    // Sync from props if settings change externally (e.g. reset)
    useEffect(() => {
        const [currH, currM] = fullTime.includes(':') ? fullTime.split(':') : ["", ""];
        setH(currH);
        setM(currM);
    }, [fullTime]);

    const handleTimeUpdate = (newH, newM) => {
        setH(newH);
        setM(newM);
        if (!newH && !newM) {
            setSettings(p => ({ ...p, ramazan: { ...(p.ramazan || {}), kohaTeravise: "" } }));
            return;
        }
        setSettings(p => ({
            ...p,
            ramazan: { ...(p.ramazan || {}), kohaTeravise: `${newH || "00"}:${newM || "00"}` }
        }));
    };

    return (
        <div className="space-y-10">
            <SectionHeader
                icon={HiClock}
                title="Ramazani"
                description="Aktivizimi i muajit të shenjtë të Ramazanit dhe konfigurimi i kohës së namazit të Teravisë."
                onReset={() => triggerConfirm(
                    "Rikthe Ramazanin",
                    "A dëshironi t'i ktheni opsionet e Ramazanit në vlerat fillestare?",
                    onReset
                )}
            />

            <div className={`grid ${(!settings.ramazan?.active || settings.appMode === 'home') ? 'grid-cols-1 max-w-xl mx-auto' : 'grid-cols-2'} gap-8`}>
                {/* Ramadan Status */}
                <div className="p-8 bg-white/5 rounded-[2.5rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col gap-8">
                    <div className="text-center">
                        <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">Statusi i Ramazanit</h4>
                        <p className="text-lg text-zinc-500 mt-2 font-medium italic opacity-70">Zgjidhni gjendjen aktuale të shfaqjes për muajin Ramazan.</p>
                    </div>
                    <div className="flex bg-zinc-900 p-2 rounded-[1.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-50" />
                        <button
                            onClick={() => setSettings(p => ({ ...p, ramazan: { ...(p.ramazan || {}), active: false } }))}
                            className={`flex-1 py-6 rounded-[1rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${!settings.ramazan?.active ? 'bg-zinc-800 text-white shadow-lg scale-[1.02] border border-white/10' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            Jo Aktiv
                        </button>
                        <button
                            onClick={() => setSettings(p => ({ ...p, ramazan: { ...(p.ramazan || {}), active: true } }))}
                            className={`flex-1 py-6 rounded-[1rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.ramazan?.active ? 'bg-emerald-500 text-black shadow-lg scale-[1.02]' : 'text-zinc-600 hover:text-emerald-500/50'}`}
                        >
                            Aktiv
                        </button>
                    </div>
                </div>

                {/* Tarawih Time (Mosque + Ramadan only) */}
                {settings.ramazan?.active && settings.appMode !== 'home' && (
                    <div className="p-8 bg-white/5 rounded-[2.5rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center">
                        <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight mb-6 text-center">Koha e Teravisë</h4>
                        <div className="flex items-center justify-center gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <input
                                    ref={hourRef}
                                    type="number" min="0" max="23" placeholder="00" value={h}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (val.length > 2) val = val.slice(0, 2);
                                        if (parseInt(val) > 23) val = "23";
                                        handleTimeUpdate(val, m);
                                        if (val.length === 2 || (val.length === 1 && parseInt(val) > 2)) minRef.current?.focus();
                                    }}
                                    className="w-24 bg-black/40 border-b-2 border-zinc-800 py-4 text-white text-4xl font-black outline-none font-mono text-center tracking-tighter focus:border-emerald-500 transition-all rounded-xl"
                                />
                                <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Ora</span>
                            </div>
                            <span className="text-4xl font-black text-white/20 pb-6">:</span>
                            <div className="flex flex-col items-center gap-2">
                                <input
                                    ref={minRef}
                                    type="number" min="0" max="59" placeholder="00" value={m}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (val.length > 2) val = val.slice(0, 2);
                                        if ((parseInt(val) || 0) > 59) val = "59";
                                        handleTimeUpdate(h, val);
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Backspace' && !m) hourRef.current?.focus(); }}
                                    className="w-24 bg-black/40 border-b-2 border-zinc-800 py-4 text-white text-4xl font-black outline-none font-mono text-center tracking-tighter focus:border-emerald-500 transition-all rounded-xl"
                                />
                                <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Minuta</span>
                            </div>
                        </div>
                        <p className="text-lg text-zinc-500 mt-4 text-center italic font-medium opacity-60">Lëreni 00:00 për ta ndjekur Jacinë.</p>
                    </div>
                )}
            </div>

            {/* Night Prayer — Mosque + Ramadan only */}
            {settings.ramazan?.active && settings.appMode !== 'home' && (
                <div className="mt-10 pt-10 border-t border-white/5 animate-in slide-in-from-bottom-5 duration-700">
                    <SectionHeader
                        icon={HiClock}
                        title="Namaz i Natës"
                        description="Tahajjud gjatë Ramazanit."
                    />

                    <div className="grid grid-cols-2 gap-8">
                        <div className="p-8 bg-white/5 rounded-[2.5rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col gap-8">
                            <div className="text-center">
                                <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">Statusi i Namazit</h4>
                                <p className="text-lg text-zinc-500 mt-2 font-medium italic opacity-70">Aktivizoni namazin e natës.</p>
                            </div>
                            <div className="flex bg-zinc-900 p-2 rounded-[1.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                                <button
                                    onClick={() => setSettings(p => ({ ...p, ramazan: { ...(p.ramazan || {}), namazNate: { ...(p.ramazan?.namazNate || {}), active: false } } }))}
                                    className={`flex-1 py-6 rounded-[1rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${!settings.ramazan?.namazNate?.active ? 'bg-zinc-800 text-white shadow-lg scale-[1.02] border border-white/10' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    Jo Aktiv
                                </button>
                                <button
                                    onClick={() => setSettings(p => ({ ...p, ramazan: { ...(p.ramazan || {}), namazNate: { ...(p.ramazan?.namazNate || {}), active: true } } }))}
                                    className={`flex-1 py-6 rounded-[1rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.ramazan?.namazNate?.active ? 'bg-emerald-500 text-black shadow-lg scale-[1.02]' : 'text-zinc-600 hover:text-emerald-500/50'}`}
                                >
                                    Aktiv
                                </button>
                            </div>
                        </div>

                        <div className={`p-8 bg-white/5 rounded-[2.5rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col items-center justify-center ${!settings.ramazan?.namazNate?.active ? 'opacity-40 pointer-events-none' : ''}`}>
                            <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight mb-6 text-center">Koha e Namazit</h4>
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex flex-col items-center gap-2">
                                    <input
                                        type="number" min="0" max="23" placeholder="00"
                                        value={settings.ramazan?.namazNate?.koha?.split(':')[0] || "00"}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (val.length > 2) val = val.slice(0, 2);
                                            if (parseInt(val) > 23) val = "23";
                                            const mPart = settings.ramazan?.namazNate?.koha?.split(':')[1] || "30";
                                            setSettings(p => ({ ...p, ramazan: { ...(p.ramazan || {}), namazNate: { ...(p.ramazan?.namazNate || {}), koha: `${val.padStart(2, '0')}:${mPart}` } } }));
                                        }}
                                        className="w-24 bg-black/40 border-b-2 border-zinc-800 py-4 text-white text-4xl font-black outline-none font-mono text-center tracking-tighter focus:border-emerald-500 transition-all rounded-xl"
                                    />
                                    <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Ora</span>
                                </div>
                                <span className="text-4xl font-black text-white/20 pb-6">:</span>
                                <div className="flex flex-col items-center gap-2">
                                    <input
                                        type="number" min="0" max="59" placeholder="30"
                                        value={settings.ramazan?.namazNate?.koha?.split(':')[1] || "30"}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (val.length > 2) val = val.slice(0, 2);
                                            if ((parseInt(val) || 0) > 59) val = "59";
                                            const hPart = settings.ramazan?.namazNate?.koha?.split(':')[0] || "00";
                                            setSettings(p => ({ ...p, ramazan: { ...(p.ramazan || {}), namazNate: { ...(p.ramazan?.namazNate || {}), koha: `${hPart}:${val.padStart(2, '0')}` } } }));
                                        }}
                                        className="w-24 bg-black/40 border-b-2 border-zinc-800 py-4 text-white text-4xl font-black outline-none font-mono text-center tracking-tighter focus:border-emerald-500 transition-all rounded-xl"
                                    />
                                    <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Minuta</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
