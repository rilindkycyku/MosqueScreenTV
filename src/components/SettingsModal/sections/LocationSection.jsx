import { HiGlobeAlt } from "react-icons/hi";
import { SectionHeader } from "./shared";

export default function LocationSection({ settings, setSettings }) {
    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <SectionHeader
                icon={HiGlobeAlt}
                title="Vaktia"
                description="Zgjidhni kalendarin e vakteve sipas shtetit tuaj."
            />
            <div className="max-w-2xl mx-auto">
                <div className="p-12 bg-white/5 rounded-[4rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col gap-12">
                    <div className="text-center">
                        <h4 className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">Shteti</h4>
                        <p className="text-xl text-zinc-500 mt-2 font-medium italic opacity-70">Vaktet ndryshojnë sipas vendit — zgjidhni të saktën.</p>
                    </div>
                    <div className="flex bg-zinc-900 p-3 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
                        <button
                            onClick={() => setSettings(p => ({ ...p, location: 'ks' }))}
                            className={`flex-1 py-10 rounded-[2.5rem] font-black text-3xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.location !== 'al' ? 'bg-emerald-500 text-black shadow-[0_0_60px_rgba(16,185,129,0.5)] scale-[1.02]' : 'text-zinc-600 hover:text-emerald-500/50'}`}
                        >
                            Kosovë
                        </button>
                        <button
                            onClick={() => setSettings(p => ({ ...p, location: 'al' }))}
                            className={`flex-1 py-10 rounded-[2.5rem] font-black text-3xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.location === 'al' ? 'bg-red-500 text-white shadow-[0_0_60px_rgba(239,68,68,0.5)] scale-[1.02]' : 'text-zinc-600 hover:text-red-500/50'}`}
                        >
                            Shqipëri
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
