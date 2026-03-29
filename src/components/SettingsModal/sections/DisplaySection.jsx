import { HiGlobeAlt, HiVolumeUp, HiVolumeOff } from "react-icons/hi";
import { SectionHeader } from "./shared";

export default function DisplaySection({ settings, setSettings, triggerConfirm, onReset }) {
    return (
        <div className="space-y-10">
            <SectionHeader
                icon={HiGlobeAlt}
                title="Ekrani"
                description="Konfiguroni elementet vizuale të ekranit."
                onReset={() => triggerConfirm(
                    "Rikthe Opsionet",
                    "A dëshironi t'i ktheni opsionet e ekranit në vlerat fillestare?",
                    onReset
                )}
            />

            <div className="grid grid-cols-2 gap-8">
                {/* App Mode Selector */}
                <div className="p-8 bg-white/5 rounded-[2.5rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col gap-8">
                    <div className="text-center">
                        <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">Mënyra e Përdorimit</h4>
                        <p className="text-lg text-zinc-500 mt-2 font-medium italic opacity-70">Xhami apo Shtëpi (Personal).</p>
                    </div>
                    <div className="flex bg-zinc-900 p-2 rounded-[1.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                        <button
                            onClick={() => setSettings(p => ({
                                ...p,
                                appMode: 'mosque',
                                showSilenceWarning: true,
                                showQr: p.showQr ?? false
                            }))}
                            className={`flex-1 py-6 rounded-[1rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.appMode === 'mosque' ? 'bg-emerald-500 text-black shadow-lg scale-[1.02]' : 'text-zinc-600 hover:text-emerald-500/50'}`}
                        >
                            Xhami
                        </button>
                        <button
                            onClick={() => setSettings(p => ({
                                ...p,
                                appMode: 'home',
                                showSilenceWarning: false,
                                showQr: false
                            }))}
                            className={`flex-1 py-6 rounded-[1rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.appMode === 'home' ? 'bg-amber-500 text-black shadow-lg scale-[1.02]' : 'text-zinc-600 hover:text-amber-500/50'}`}
                        >
                            Shtëpi
                        </button>
                    </div>
                </div>

                {/* Radio Quran (Home Only) */}
                {settings.appMode === 'home' && (
                    <div className="p-8 bg-white/5 rounded-[2.5rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col items-center justify-between text-center min-h-[300px]">
                        <div>
                            <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">Radio Kurani (LIVE)</h4>
                            <p className="text-lg text-zinc-500 mt-2 font-medium italic opacity-70 px-4">Dëgjoni Kuran (Yasser Al-Dosari) në shtëpi.</p>
                        </div>
                        <button
                            onClick={() => setSettings(p => ({ ...p, showQuranRadio: !p.showQuranRadio }))}
                            className={`flex items-center gap-4 px-10 py-6 rounded-[2rem] font-black text-2xl uppercase tracking-widest transition-all duration-700 relative z-10 w-full justify-center ${settings.showQuranRadio ? 'bg-emerald-500 text-black shadow-lg scale-[1.05]' : 'bg-zinc-900 text-zinc-600 hover:text-emerald-400/50'}`}
                        >
                            {settings.showQuranRadio ? <HiVolumeUp size={30} /> : <HiVolumeOff size={30} />}
                            <span>{settings.showQuranRadio ? "AKTIVE" : "JO AKTIVE"}</span>
                        </button>
                    </div>
                )}

                {/* Sabahu Offset (Mosque Only) */}
                {settings.appMode === 'mosque' && (
                    <div className="p-8 bg-white/5 rounded-[2.5rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col items-center">
                        <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight mb-6">Sabahu (Offset)</h4>
                        <div className="flex items-center gap-6">
                            <input
                                type="number"
                                min="0"
                                max="60"
                                value={settings.durations?.sabahuOffset ?? 35}
                                onChange={(e) => setSettings(p => ({
                                    ...p,
                                    durations: { ...p.durations, sabahuOffset: Math.max(0, parseInt(e.target.value) || 0) }
                                }))}
                                className="w-24 bg-black/40 border-b-2 border-zinc-800 py-4 text-white text-4xl font-black outline-none font-mono text-center tracking-tighter focus:border-emerald-500 transition-all rounded-xl"
                            />
                            <span className="text-zinc-500 font-black uppercase text-xl tracking-[0.2em]">min</span>
                        </div>
                        <p className="text-lg text-zinc-500 mt-4 text-center italic font-medium opacity-60">Minuta para Lindjes.</p>
                    </div>
                )}
            </div>

            {/* QR & Silence Warning (Mosque Only) */}
            {settings.appMode === 'mosque' && (
                <div className="space-y-16 pt-16 border-t border-white/5">
                    <SectionHeader
                        icon={HiGlobeAlt}
                        title="QR Code & Opsionet"
                        description="Konfigurimet shtesë për xhami."
                    />

                    <div className="grid grid-cols-2 gap-8">
                        <div className="p-8 bg-white/5 rounded-[2.5rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col gap-8">
                            <div className="text-center">
                                <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">Vërejtja e Heshtjes</h4>
                                <p className="text-lg text-zinc-500 mt-2 font-medium italic opacity-70">Thirrja "FIKNI TELEFONAT" në ekran.</p>
                            </div>
                            <div className="flex bg-zinc-900 p-2 rounded-[1.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                                <button
                                    onClick={() => setSettings(p => ({ ...p, showSilenceWarning: false }))}
                                    className={`flex-1 py-6 rounded-[1rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${!settings.showSilenceWarning ? 'bg-zinc-800 text-white shadow-lg scale-[1.02] border border-white/10' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    Jo Aktiv
                                </button>
                                <button
                                    onClick={() => setSettings(p => ({ ...p, showSilenceWarning: true }))}
                                    className={`flex-1 py-6 rounded-[1rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.showSilenceWarning ? 'bg-emerald-500 text-black shadow-lg scale-[1.02]' : 'text-zinc-600 hover:text-emerald-400/50'}`}
                                >
                                    Aktiv
                                </button>
                            </div>
                        </div>

                        <div className="p-8 bg-white/5 rounded-[2.5rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col gap-8">
                            <div className="text-center">
                                <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">QR Code</h4>
                                <p className="text-lg text-zinc-500 mt-2 font-medium italic opacity-70">Shfaqni kodin QR.</p>
                            </div>
                            <div className="flex bg-zinc-900 p-2 rounded-[1.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                                <button
                                    onClick={() => setSettings(p => ({ ...p, showQr: false }))}
                                    className={`flex-1 py-6 rounded-[1rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${!settings.showQr ? 'bg-zinc-800 text-white shadow-lg scale-[1.02] border border-white/10' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    Jo Aktiv
                                </button>
                                <button
                                    onClick={() => setSettings(p => ({ ...p, showQr: true }))}
                                    className={`flex-1 py-6 rounded-[1rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.showQr ? 'bg-emerald-500 text-black shadow-lg scale-[1.02]' : 'text-zinc-600 hover:text-emerald-500/50'}`}
                                >
                                    Aktiv
                                </button>
                            </div>
                        </div>


                    </div>

                    <div className={`mt-8 p-8 bg-white/5 rounded-[2.5rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group ${!settings.showQr ? 'opacity-40 pointer-events-none' : ''}`}>
                        <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight mb-6 text-center">URL e QR Kodit</h4>
                        <input
                            type="text"
                            value={settings.qrUrl}
                            onChange={(e) => setSettings(p => ({ ...p, qrUrl: e.target.value }))}
                            className="w-full bg-black/40 border-b-2 border-zinc-800 py-4 px-6 text-white text-2xl font-black outline-none focus:border-emerald-500 transition-all rounded-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
