import { HiClock } from "react-icons/hi";
import { SectionHeader } from "./shared";

export default function DurationsSection({ settings, setSettings, triggerConfirm, onReset }) {
    const fields = [
        { id: 'hadithRefresh', label: 'Rifreskimi i Hadithit / Ajetit', desc: 'Koha për përditësimin automatik të Hadithit / Ajetit.' },
        { id: 'hadith', label: 'Hadithi / Ajeti', desc: 'Sa kohë të qëndrojë Hadithi / Ajeti i shfaqur.' },
        { id: 'qr', label: 'QR Kodi', desc: 'Koha e shfaqjes së QR Code për skanim.', mosqueOnly: true },
        { id: 'notification', label: 'Njoftimi Special', desc: 'Sa kohë të shfaqet mesazhi juaj i lënë.', mosqueOnly: true },
        { id: 'announcement', label: 'Festat / Shënimet', desc: 'Koha për shfaqjen e festave dhe shënimeve nga kalendari.' }
    ].filter(f => !f.mosqueOnly || settings.appMode === 'mosque');

    return (
        <div className="space-y-10">
            <SectionHeader
                icon={HiClock}
                title="Timerat"
                description="Menaxhimi i kohës për çdo element që qarkullon në ciklin e shfaqjes."
                onReset={() => triggerConfirm(
                    "Rikthe Timerat",
                    "A dëshironi të ktheni të gjitha kohëzgjatjet në vlerat fillestare?",
                    onReset
                )}
            />

            <div className="grid grid-cols-3 gap-8">
                {fields.map(f => (
                    <div key={f.id} className="p-6 bg-white/5 rounded-[2rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all duration-500 group">
                        <div className="flex flex-col gap-4 mb-4">
                            <h4 className="text-xl font-black text-white group-hover:text-emerald-400 transition-colors tracking-tighter uppercase leading-tight">{f.label}</h4>
                            <div className="flex items-baseline gap-3">
                                <input
                                    type="number"
                                    min={f.id === 'hadithRefresh' ? Math.max(1, (settings.durations.hadith > 1000 ? Math.round(settings.durations.hadith / 60000) : (settings.durations.hadith || 0))) : "0"}
                                    value={settings.durations[f.id] > 1000 ? Math.round(settings.durations[f.id] / 60000) : (settings.durations[f.id] || 0)}
                                    onChange={(e) => {
                                        let val = Math.max(0, Number(e.target.value));
                                        if (f.id === 'hadithRefresh') {
                                            const minV = Math.max(1, (settings.durations.hadith > 1000 ? Math.round(settings.durations.hadith / 60000) : (settings.durations.hadith || 0)));
                                            val = Math.max(minV, val);
                                        }
                                        setSettings(p => ({
                                            ...p,
                                            durations: { ...p.durations, [f.id]: val }
                                        }))
                                    }}
                                    className="w-20 bg-black/60 text-center border-b-2 border-zinc-800 text-3xl font-black text-emerald-400 py-3 focus:border-emerald-500 outline-none transition-all font-mono"
                                />
                                <span className="text-zinc-600 font-black uppercase text-lg tracking-widest">min</span>
                            </div>
                        </div>
                        <p className="text-lg text-zinc-500 font-medium leading-relaxed italic opacity-80">"{f.desc}"</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
