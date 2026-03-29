import { useEffect } from "react";
import { HiX, HiIdentification, HiClock, HiSpeakerphone, HiGlobeAlt, HiRefresh, HiCheckCircle } from "react-icons/hi";

// Section components — each in its own file for easy maintenance
import IdentitySection  from "./sections/IdentitySection";
import DisplaySection   from "./sections/DisplaySection";
import LocationSection  from "./sections/LocationSection";
import DurationsSection from "./sections/DurationsSection";
import RamazanSection   from "./sections/RamazanSection";
import MessageSection   from "./sections/MessageSection";

/**
 * SettingsModal — full-screen settings interface for TV displays.
 * This file is intentionally thin: it owns only the sidebar chrome and
 * tab routing. All content lives in ./sections/*.
 */
export default function SettingsModal({
    show,
    onClose,
    activeTab,
    setActiveTab,
    tempSettings,
    setTempSettings,
    saveSettings,
    triggerConfirm,
    resetCategory,
    resetToFactory
}) {
    const tabs = [
        { id: 'identity',  label: 'Të dhënat',    icon: HiIdentification, subtitle: 'Të dhënat e xhamisë',                mosqueOnly: true },
        { id: 'display',   label: 'Ekrani',        icon: HiGlobeAlt,       subtitle: 'Konfigurimi i shfaqjes' },
        { id: 'location',  label: 'Vaktia',        icon: HiGlobeAlt,       subtitle: 'Kosovë / Shqipëri' },
        { id: 'durations', label: 'Kohëzgjatja',   icon: HiClock,          subtitle: 'Ciklet e shfaqjes',                   mosqueOnly: true },
        { id: 'ramazan',   label: 'Ramazani',      icon: HiClock,          subtitle: 'Konfigurimi i muajit të ramazanit' },
        { id: 'message',   label: 'Njoftimet',     icon: HiSpeakerphone,   subtitle: 'Mesazh i shpejtë',                    mosqueOnly: true }
    ].filter(tab => !tab.mosqueOnly || tempSettings.appMode === 'mosque');

    // Reset tempSettings to committed settings whenever the modal opens —
    // ensures "Mbyll" (cancel) always discards unsaved changes.
    useEffect(() => {
        // This effect intentionally has no dep on `settings` to avoid import cycles;
        // the caller (App.jsx) passes a fresh `tempSettings` reset on open.
    }, []);

    // Auto-switch to a visible tab if the current one becomes hidden (e.g. mode toggle)
    useEffect(() => {
        if (!show) return;
        const isCurrentTabVisible = tabs.some(t => t.id === activeTab);
        if (!isCurrentTabVisible) setActiveTab('display');
    }, [show, tempSettings.appMode, activeTab, tabs]);

    // Handle Escape to trigger auto-save Close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };
        if (show) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black animate-in fade-in duration-500">
            <div className="w-full h-full flex relative">

                {/* ── SIDEBAR ── */}
                <aside className="w-[28rem] bg-zinc-900 border-r border-white/5 p-10 flex flex-col relative z-20 shadow-2xl overflow-y-auto custom-scrollbar shrink-0">

                    <button
                        onClick={onClose}
                        className="flex items-center gap-4 px-6 py-4 rounded-[1.5rem] bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-500 border-2 border-red-500/20 mb-6 active:scale-95 group shadow-lg shrink-0"
                    >
                        <HiX className="text-2xl group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-black text-lg uppercase tracking-widest">Mbyll</span>
                    </button>

                    <div className="mb-8 px-2 shrink-0">
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Cilësimet</h2>
                        <div className="h-1 w-16 bg-emerald-500 mt-3 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                    </div>

                    <nav className="flex flex-col gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-5 px-6 py-4 rounded-[1.5rem] transition-all duration-500 group relative overflow-hidden text-left ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-400 border border-emerald-500/20 shadow-inner'
                                    : 'hover:bg-white/5 text-zinc-500 border border-transparent'
                                    }`}
                            >
                                {activeTab === tab.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500 rounded-r-full shadow-[0_0_30px_rgba(16,185,129,0.8)]" />
                                )}
                                <tab.icon className={`text-4xl transition-all duration-500 ${activeTab === tab.id
                                    ? 'text-emerald-400 scale-110 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]'
                                    : 'group-hover:text-emerald-400'
                                    }`} />
                                <div>
                                    <div className={`font-black text-2xl uppercase tracking-tighter leading-tight ${activeTab === tab.id ? 'text-white' : ''}`}>
                                        {tab.label}
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase tracking-widest opacity-40 ${activeTab === tab.id ? 'text-emerald-300' : ''}`}>
                                        {tab.subtitle}
                                    </div>
                                </div>
                            </button>
                        ))}

                        <button
                            onClick={() => triggerConfirm(
                                "Rikthim Total",
                                "A dëshironi t'i ktheni të gjitha cilësimet në vlerat e fabrikës?",
                                resetToFactory
                            )}
                            className="flex items-center gap-5 px-6 py-4 rounded-[1.5rem] bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-500 border border-red-500/20 active:scale-95 group w-full text-left mt-2"
                        >
                            <HiRefresh className="text-3xl group-hover:rotate-180 transition-transform duration-700" />
                            <div className="font-black text-lg uppercase tracking-tighter leading-tight">Konfigurimi Bazik</div>
                        </button>
                    </nav>

                    <div className="mt-auto flex flex-col gap-6 pt-10 border-t border-white/5">
                        <button
                            onClick={saveSettings}
                            className="flex items-center justify-center gap-4 py-6 bg-gradient-to-br from-emerald-400 to-emerald-600 text-black rounded-[2rem] font-black text-xl uppercase tracking-[0.2em] hover:brightness-110 hover:scale-[1.02] transition-all active:scale-95 shadow-lg group"
                        >
                            <HiCheckCircle className="text-3xl group-hover:scale-110 transition-transform" />
                            Ruaj
                        </button>

                        <div className="mt-auto flex flex-col items-center py-4 border-t border-white/10 pt-8">
                            <span className="text-zinc-300 text-lg font-black uppercase tracking-[0.4em] mb-2">Mosque Screen TV</span>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Zhvilluar nga</span>
                                <span className="text-emerald-400 text-xl font-black uppercase tracking-tight">Rilind Kyçyku</span>
                                <span className="text-zinc-600 text-[10px] uppercase font-black tracking-widest mt-1 underline decoration-emerald-500/30">www.tv.rilindkycyku.dev</span>
                                <span className="text-zinc-600 text-[10px] uppercase font-black tracking-widest underline decoration-emerald-500/30">www.rilindkycyku.dev</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── MAIN CONTENT ── */}
                <main className="flex-1 p-10 pb-32 overflow-y-auto custom-scrollbar relative bg-zinc-950">
                    <div className="animate-slide-up">
                        {activeTab === 'identity'  && <IdentitySection  settings={tempSettings} setSettings={setTempSettings} triggerConfirm={triggerConfirm} onReset={() => resetCategory('identity')} />}
                        {activeTab === 'display'   && <DisplaySection   settings={tempSettings} setSettings={setTempSettings} triggerConfirm={triggerConfirm} onReset={() => resetCategory('identity')} />}
                        {activeTab === 'location'  && <LocationSection  settings={tempSettings} setSettings={setTempSettings} />}
                        {activeTab === 'durations' && <DurationsSection settings={tempSettings} setSettings={setTempSettings} triggerConfirm={triggerConfirm} onReset={() => resetCategory('durations')} />}
                        {activeTab === 'ramazan'   && <RamazanSection   settings={tempSettings} setSettings={setTempSettings} triggerConfirm={triggerConfirm} onReset={() => resetCategory('ramazan')} />}
                        {activeTab === 'message'   && <MessageSection   settings={tempSettings} setSettings={setTempSettings} triggerConfirm={triggerConfirm} onReset={() => resetCategory('message')} />}
                    </div>
                </main>
            </div>
        </div>
    );
}
