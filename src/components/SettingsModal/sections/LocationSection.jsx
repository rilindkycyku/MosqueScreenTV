import { HiGlobeAlt, HiClock, HiExclamation } from "react-icons/hi";
import { SectionHeader, TimePicker } from "./shared";

export default function LocationSection({ settings, setSettings, triggerConfirm, onReset }) {
    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <SectionHeader
                icon={HiGlobeAlt}
                title="Vaktet & Namazet"
                description="Zgjidhni kalendarin zyrtar dhe konfiguroni kohët e namazeve."
                onReset={() => triggerConfirm(
                    "Rikthe Vaktet",
                    "A dëshironi t'i ktheni të gjitha kohët dhe parametrat e vaktit në vlerat fillestare?",
                    onReset
                )}
            />
            
            <div className="grid grid-cols-1 gap-14">
                {/* 1. Location Selector */}
                <div className="p-10 bg-white/5 rounded-[3rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col gap-10 shadow-2xl">
                    <div className="text-center">
                        <h4 className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">Shteti / Kalendari</h4>
                        <p className="text-xl text-zinc-500 mt-3 font-medium italic opacity-70">Zgjidhni shtetin për të ngarkuar kalendarin e saktë vjetor.</p>
                    </div>
                    <div className="flex bg-zinc-900 p-3 rounded-[2.2rem] border border-white/10 shadow-inner relative overflow-hidden max-w-2xl mx-auto w-full">
                        <button
                            onClick={() => setSettings(p => ({ ...p, location: 'ks' }))}
                            className={`flex-1 py-8 rounded-[1.8rem] font-black text-2xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.location !== 'al' ? 'bg-emerald-500 text-black shadow-[0_0_50px_rgba(16,185,129,0.3)] scale-[1.02]' : 'text-zinc-600 hover:text-emerald-500/50'}`}
                        >
                            Kosovë
                        </button>
                        <button
                            onClick={() => setSettings(p => ({ ...p, location: 'al' }))}
                            className={`flex-1 py-8 rounded-[1.8rem] font-black text-2xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.location === 'al' ? 'bg-red-600 text-white shadow-[0_0_50px_rgba(220,38,38,0.3)] scale-[1.02]' : 'text-zinc-600 hover:text-red-500/50'}`}
                        >
                            Shqipëri
                        </button>
                    </div>
                </div>

                {/* 2. Manual Time Overrides (Mosque Mode Only) */}
                {settings.appMode === 'mosque' && (
                    <div className="space-y-12 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-8 px-4">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl">
                                <HiClock className="text-4xl text-emerald-500" />
                            </div>
                            <div>
                                <h5 className="text-3xl font-black text-white uppercase tracking-tight">Konfigurimi i Namazeve</h5>
                                <p className="text-lg text-zinc-500 font-medium italic opacity-70 mt-1">Vendosni kohët manuale nëse ndryshojnë nga kalendari.</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <TimePicker
                                label="Sabahu (Para Lindjes)"
                                description="Minuta para Lindjes së Diellit (p.sh. 35 min)."
                                isOffset={true}
                                value={settings.durations.sabahuOffset}
                                onChange={val => setSettings(p => ({
                                    ...p,
                                    durations: { ...p.durations, sabahuOffset: val }
                                }))}
                            />
                            <TimePicker
                                label="Dreka"
                                description="Lëreni 00:00 për automatik (12:55)."
                                value={settings.manualDreka}
                                onChange={val => setSettings(p => ({ ...p, manualDreka: val }))}
                            />
                            <TimePicker
                                label="Xhumaja I"
                                description="Nëse lihet 00:00, përdoret Dreka."
                                value={settings.manualXhuma1}
                                onChange={val => setSettings(p => ({ ...p, manualXhuma1: val }))}
                            />
                        </div>

                        <div className="p-10 bg-zinc-900/40 rounded-[3rem] border-2 border-white/5 flex flex-col gap-10">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                                        Namazi i dytë i Xhumasë
                                        {settings.xhuma2Active && <span className="bg-emerald-500/10 text-emerald-500 text-xs py-1 px-3 rounded-full animate-pulse">AKTIV</span>}
                                    </h4>
                                    <p className="text-lg text-zinc-500 font-medium italic opacity-70">Aktivizoni nëse xhamia ka dy seanca të xhumasë.</p>
                                </div>
                                <div className="flex bg-black/40 p-2 rounded-[1.5rem] border border-white/10 shadow-inner w-80">
                                    <button
                                        onClick={() => setSettings(p => ({ ...p, xhuma2Active: false }))}
                                        className={`flex-1 py-4 rounded-[1rem] font-black text-lg uppercase tracking-widest transition-all duration-300 ${!settings.xhuma2Active ? 'bg-zinc-800 text-zinc-400 shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
                                    >
                                        Jo
                                    </button>
                                    <button
                                        onClick={() => setSettings(p => ({ ...p, xhuma2Active: true }))}
                                        className={`flex-1 py-4 rounded-[1rem] font-black text-lg uppercase tracking-widest transition-all duration-300 ${settings.xhuma2Active ? 'bg-emerald-500 text-black shadow-lg' : 'text-zinc-600 hover:text-emerald-500/50'}`}
                                    >
                                        Po
                                    </button>
                                </div>
                            </div>

                            {settings.xhuma2Active && (
                                <div className="animate-in slide-in-from-top-4 duration-500 max-w-xl">
                                    <TimePicker
                                        label="Ora e Xhumasë II"
                                        description="Vetëm të Premteve, zëvendëson ekranin pas Xhumasë I."
                                        value={settings.manualXhuma2}
                                        onChange={val => setSettings(p => ({ ...p, manualXhuma2: val }))}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-amber-500/5 border-2 border-amber-500/10 rounded-[2.5rem] flex items-start gap-8">
                             <div className="p-4 bg-amber-500/20 rounded-2xl shrink-0">
                                <HiExclamation className="text-4xl text-amber-500" />
                             </div>
                             <div>
                                 <h5 className="text-xl font-black text-amber-500 uppercase tracking-tighter mb-1">Këshillë: Përdorimi i 00:00</h5>
                                 <p className="text-lg text-zinc-400 font-medium leading-relaxed italic">Vlerat 00:00 llogariten automatikisht nga sistemi sipas kalendarit zyrtar të zgjedhur më lart.</p>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
