import { useRef, useState, useEffect } from "react";
import { HiClock } from "react-icons/hi";
import { SectionHeader, TimePicker } from "./shared";

export default function RamazanSection({ settings, setSettings, triggerConfirm, onReset }) {

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
                    <div className="animate-in zoom-in-95 duration-500">
                        <TimePicker
                            label="Koha e Teravisë"
                            description="Lëreni 00:00 për ta ndjekur Jacinë."
                            value={settings.ramazan?.kohaTeravise || ""}
                            onChange={(val) => {
                                if (val === "00:00") val = "";
                                setSettings(p => ({ ...p, ramazan: { ...(p.ramazan || {}), kohaTeravise: val } }));
                            }}
                        />
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

                        <div className={`transition-all duration-300 ${!settings.ramazan?.namazNate?.active ? 'opacity-40 pointer-events-none' : ''}`}>
                            <TimePicker
                                label="Koha e Namazit"
                                value={settings.ramazan?.namazNate?.koha || "00:30"}
                                onChange={(val) => {
                                    setSettings(p => ({
                                        ...p,
                                        ramazan: {
                                            ...(p.ramazan || {}),
                                            namazNate: { ...(p.ramazan?.namazNate || {}), koha: val }
                                        }
                                    }));
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
