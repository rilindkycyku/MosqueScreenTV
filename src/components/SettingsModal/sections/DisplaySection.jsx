import { HiGlobeAlt, HiVolumeUp, HiVolumeOff, HiDesktopComputer } from "react-icons/hi";
import { SectionHeader } from "./shared";

export default function DisplaySection({ settings, setSettings, triggerConfirm, onReset }) {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <SectionHeader
                icon={HiDesktopComputer}
                title="Ekrani"
                description="Konfiguroni elementet vizuale dhe modalitetin e shfaqjes."
                onReset={() => triggerConfirm(
                    "Rikthe Opsionet",
                    "A dëshironi t'i ktheni opsionet e ekranit në vlerat fillestare?",
                    onReset
                )}
            />

            <div className={`grid gap-12 ${settings.appMode === 'home' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {/* 1. App Mode Selector */}
                <div className="p-10 bg-white/5 rounded-[3rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col gap-10">
                    <div className="text-center">
                        <h4 className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">Mënyra e Përdorimit</h4>
                        <p className="text-xl text-zinc-500 mt-3 font-medium italic opacity-70">Zgjidhni profilin e përshtatshëm për nevojat tuaja.</p>
                    </div>
                    <div className="flex bg-zinc-900 p-2 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden max-w-2xl mx-auto w-full">
                        <button
                            onClick={() => setSettings(p => ({
                                ...p,
                                appMode: 'mosque',
                                showSilenceWarning: true,
                                showQr: p.showQr ?? false
                            }))}
                            className={`flex-1 py-8 rounded-[1.5rem] font-black text-2xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.appMode === 'mosque' ? 'bg-emerald-500 text-black shadow-lg scale-[1.02]' : 'text-zinc-600 hover:text-emerald-500/50'}`}
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
                            className={`flex-1 py-8 rounded-[1.5rem] font-black text-2xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.appMode === 'home' ? 'bg-amber-500 text-black shadow-lg scale-[1.02]' : 'text-zinc-600 hover:text-amber-500/50'}`}
                        >
                            Shtëpi
                        </button>
                    </div>
                </div>

                {/* 2. Radio Quran (Home Only) */}
                {settings.appMode === 'home' && (
                    <div className="p-10 bg-white/5 rounded-[3rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col items-center justify-between text-center">
                        <div className="mb-6">
                            <h4 className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">Radio Kurani</h4>
                            <p className="text-xl text-zinc-500 mt-3 font-medium italic opacity-70 px-4">Dëgjoni Kuran LIVE direkt nga ekrani juaj në shtëpi.</p>
                        </div>
                        <button
                            onClick={() => setSettings(p => ({ ...p, showQuranRadio: !p.showQuranRadio }))}
                            className={`flex items-center gap-6 px-14 py-8 rounded-[2.5rem] font-black text-3xl uppercase tracking-widest transition-all duration-700 relative z-10 w-full justify-center ${settings.showQuranRadio ? 'bg-emerald-500 text-black shadow-lg scale-[1.05]' : 'bg-zinc-900 text-zinc-600 hover:text-emerald-400/50 shadow-inner'}`}
                        >
                            {settings.showQuranRadio ? <HiVolumeUp size={36} /> : <HiVolumeOff size={36} />}
                            <span>{settings.showQuranRadio ? "AKTIVE" : "JO AKTIVE"}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* QR & Silence Warning (Mosque Only) */}
            {settings.appMode === 'mosque' && (
                <div className="space-y-16 pt-16 border-t border-white/5 animate-in fade-in zoom-in-95 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="p-10 bg-white/5 rounded-[3rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col gap-10">
                            <div className="text-center">
                                <h4 className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">Vërejtja e Heshtjes</h4>
                                <p className="text-xl text-zinc-500 mt-2 font-medium italic opacity-70">Thirrja "FIKNI TELEFONAT" gjatë namazit.</p>
                            </div>
                            <div className="flex bg-zinc-900 p-2 rounded-[1.8rem] border border-white/10 shadow-2xl relative overflow-hidden">
                                <button
                                    onClick={() => setSettings(p => ({ ...p, showSilenceWarning: false }))}
                                    className={`flex-1 py-6 rounded-[1.2rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${!settings.showSilenceWarning ? 'bg-zinc-800 text-zinc-400 shadow-md scale-[1.02] border border-white/5' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    Jo Aktiv
                                </button>
                                <button
                                    onClick={() => setSettings(p => ({ ...p, showSilenceWarning: true }))}
                                    className={`flex-1 py-6 rounded-[1.2rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.showSilenceWarning ? 'bg-emerald-500 text-black shadow-lg scale-[1.02]' : 'text-zinc-600 hover:text-emerald-500/50'}`}
                                >
                                    Aktiv
                                </button>
                            </div>
                        </div>

                        <div className="p-10 bg-white/5 rounded-[3rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col gap-10">
                            <div className="text-center">
                                <h4 className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">QR Code</h4>
                                <p className="text-xl text-zinc-500 mt-2 font-medium italic opacity-70">A dëshironi ta shfaqni kodin QR në ekran?</p>
                            </div>
                            <div className="flex bg-zinc-900 p-2 rounded-[1.8rem] border border-white/10 shadow-2xl relative overflow-hidden">
                                <button
                                    onClick={() => setSettings(p => ({ ...p, showQr: false }))}
                                    className={`flex-1 py-6 rounded-[1.2rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${!settings.showQr ? 'bg-zinc-800 text-zinc-400 shadow-md scale-[1.02] border border-white/5' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                    Jo Aktiv
                                </button>
                                <button
                                    onClick={() => setSettings(p => ({ ...p, showQr: true }))}
                                    className={`flex-1 py-6 rounded-[1.2rem] font-black text-xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.showQr ? 'bg-emerald-500 text-black shadow-lg scale-[1.02]' : 'text-zinc-600 hover:text-emerald-500/50'}`}
                                >
                                    Aktiv
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={`mt-8 p-10 bg-white/5 rounded-[3rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group ${!settings.showQr ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                        <div className="flex flex-col items-center gap-6">
                            <h4 className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">URL e QR Kodit</h4>
                            <input
                                type="text"
                                spellCheck="false"
                                value={settings.qrUrl}
                                onChange={(e) => setSettings(p => ({ ...p, qrUrl: e.target.value }))}
                                placeholder="https://..."
                                className="w-full bg-black/40 border-2 border-white/5 py-8 px-10 text-white text-3xl font-black outline-none focus:border-emerald-500 transition-all rounded-[2rem] shadow-inner text-center font-mono"
                            />
                            <p className="text-lg text-zinc-500 font-medium italic opacity-60">Lidhja ku dëshironi t'i dërgoni besimtarët.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
