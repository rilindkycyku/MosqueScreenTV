import { useRef, useState, useEffect } from "react";
import {
    HiX,
    HiIdentification,
    HiClock,
    HiSpeakerphone,
    HiGlobeAlt,
    HiRefresh,
    HiCheckCircle
} from "react-icons/hi";

/**
 * SettingsModal Component
 * A comprehensive, full-screen settings interface designed for TV displays.
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
    if (!show) return null;

    const tabs = [
        { id: 'identity', label: 'Të dhënat', icon: HiIdentification, subtitle: 'Të dhënat e xhamisë' },
        { id: 'durations', label: 'Kohëzgjatja', icon: HiClock, subtitle: 'Ciklet e shfaqjes' },
        { id: 'ramazan', label: 'Ramazani', icon: HiClock, subtitle: 'Konfigurimi i muajit të ramazanit' },
        { id: 'message', label: 'Njoftimet', icon: HiSpeakerphone, subtitle: 'Mesazh i shpejtë' }
    ];

    return (
        <div className="fixed inset-0 z-[200] bg-black animate-in fade-in duration-500">
            <div className="w-full h-full flex relative">

                {/* --- SIDEBAR --- */}
                <aside className="w-[35rem] bg-zinc-900 border-r border-white/5 p-16 flex flex-col relative z-20 shadow-2xl overflow-y-auto custom-scrollbar shrink-0">

                    {/* Primary Close Action */}
                    <button
                        onClick={onClose}
                        className="flex items-center gap-5 px-8 py-5 rounded-[2.5rem] bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-500 border-2 border-red-500/20 mb-8 active:scale-95 group shadow-lg shrink-0"
                    >
                        <HiX className="text-3xl group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-black text-xl uppercase tracking-widest">Mbyll</span>
                    </button>

                    <div className="mb-12 px-4 shrink-0">
                        <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Cilësimet</h2>
                        <div className="h-1.5 w-24 bg-emerald-500 mt-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="flex flex-col gap-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-7 px-8 py-5 rounded-[2.5rem] transition-all duration-500 group relative overflow-hidden text-left ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-400 border border-emerald-500/20 shadow-inner'
                                    : 'hover:bg-white/5 text-zinc-500 border border-transparent'
                                    }`}
                            >
                                {activeTab === tab.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-emerald-500 rounded-r-full shadow-[0_0_30px_rgba(16,185,129,0.8)]" />
                                )}
                                <tab.icon className={`text-5xl transition-all duration-500 ${activeTab === tab.id
                                    ? 'text-emerald-400 scale-110 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]'
                                    : 'group-hover:text-emerald-400'
                                    }`} />
                                <div>
                                    <div className={`font-black text-3xl uppercase tracking-tighter leading-tight ${activeTab === tab.id ? 'text-white' : ''}`}>
                                        {tab.label}
                                    </div>
                                    <div className={`text-sm font-bold uppercase tracking-widest opacity-40 ${activeTab === tab.id ? 'text-emerald-300' : ''}`}>
                                        {tab.subtitle}
                                    </div>
                                </div>
                            </button>
                        ))}

                        <button
                            onClick={() => triggerConfirm(
                                "Rikthim Total",
                                "A dëshironi t'i ktheni të gjitha cilësimet në vlerat e fabrikës? Ky veprim fshin çdo ndryshim tuajin.",
                                resetToFactory
                            )}
                            className="flex items-center gap-7 px-8 py-5 rounded-[2.5rem] bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-500 border border-red-500/20 active:scale-95 group w-full text-left mt-2"
                        >
                            <HiRefresh className="text-5xl group-hover:rotate-180 transition-transform duration-700" />
                            <div>
                                <div className="font-black text-2xl uppercase tracking-tighter leading-tight">Konfigurimi Bazik</div>
                            </div>
                        </button>
                    </nav>

                    {/* Global Actions */}
                    <div className="mt-auto flex flex-col gap-8 pt-12 border-t border-white/5">
                        <button
                            onClick={saveSettings}
                            className="flex items-center justify-center gap-5 py-9 bg-gradient-to-br from-emerald-400 to-emerald-600 text-black rounded-[3rem] font-black text-2xl uppercase tracking-[0.2em] hover:brightness-110 hover:scale-[1.02] transition-all active:scale-95 shadow-[0_20px_60px_rgba(16,185,129,0.3)] group"
                        >
                            <HiCheckCircle className="text-4xl group-hover:scale-110 transition-transform" />
                            Ruaj
                        </button>

                        <div className="mt-auto flex flex-col items-center py-6 border-t border-white/20 pt-10">
                            <span className="text-zinc-300 text-xl font-black uppercase tracking-[0.4em] mb-3">Mosque Screen TV Edition</span>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-zinc-500 text-sm font-bold uppercase tracking-[0.2em]">Developed by</span>
                                <span className="text-emerald-400 text-3xl font-black uppercase tracking-tight shadow-emerald-500/20 drop-shadow-xl">Rilind Kycyku</span>
                                <span className="text-zinc-600 text-base uppercase font-black tracking-widest mt-2 underline decoration-emerald-500/30">rilindkycyku.dev</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* --- MAIN CONTENT --- */}
                <main className="flex-1 p-10 pb-32 overflow-y-auto custom-scrollbar relative bg-zinc-950">
                    <div className="animate-slide-up">
                        {activeTab === 'identity' && (
                            <IdentitySection
                                settings={tempSettings}
                                setSettings={setTempSettings}
                                triggerConfirm={triggerConfirm}
                                onReset={() => resetCategory('identity')}
                            />
                        )}
                        {activeTab === 'durations' && (
                            <DurationsSection
                                settings={tempSettings}
                                setSettings={setTempSettings}
                                triggerConfirm={triggerConfirm}
                                onReset={() => resetCategory('durations')}
                            />
                        )}
                        {activeTab === 'ramazan' && (
                            <RamazanSection
                                settings={tempSettings}
                                setSettings={setTempSettings}
                                triggerConfirm={triggerConfirm}
                                onReset={() => resetCategory('ramazan')}
                            />
                        )}
                        {activeTab === 'message' && (
                            <MessageSection
                                settings={tempSettings}
                                setSettings={setTempSettings}
                                triggerConfirm={triggerConfirm}
                                onReset={() => resetCategory('message')}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

/* --- SUB-COMPONENTS FOR BETTER READABILITY --- */

function SectionHeader({ icon: Icon, title, description, onReset, resetLabel = "Reset" }) {
    return (
        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
            <div className="flex items-center gap-8">
                <div className="p-6 bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] rounded-[2rem]">
                    <Icon className="text-5xl text-black" />
                </div>
                <div>
                    <h3 className="text-5xl font-black text-white tracking-tighter uppercase leading-tight">{title}</h3>
                    <p className="text-xl text-zinc-500 font-medium mt-2 leading-relaxed">{description}</p>
                </div>
            </div>
            {onReset && (
                <button
                    onClick={onReset}
                    className="flex items-center gap-5 px-14 py-8 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-[3rem] font-black text-xl uppercase tracking-[0.3em] transition-all border-2 border-red-500/20 hover:border-red-500 active:scale-95 group shadow-2xl"
                >
                    <HiRefresh className="text-4xl group-hover:rotate-180 transition-transform duration-700" />
                    {resetLabel}
                </button>
            )}
        </div>
    );
}

function IdentitySection({ settings, setSettings, triggerConfirm, onReset }) {
    return (
        <div className="space-y-16">
            <SectionHeader
                icon={HiIdentification}
                title="Identiteti"
                description="Informacionet kryesore të xhamisë që shfaqen në krye të ekranit."
                onReset={() => triggerConfirm(
                    "Rikthe Identitetin",
                    "A dëshironi t'i ktheni të dhënat e xhamisë (Emri, Adresa, Imami) në vlerat fillestare?",
                    onReset
                )}
            />

            <div className="grid grid-cols-2 gap-12">
                <InputField
                    label="Emri i Xhamisë"
                    value={settings.name}
                    onChange={val => setSettings(p => ({ ...p, name: val }))}
                />
                <InputField
                    label="Vendndodhja / Adresa"
                    value={settings.address}
                    onChange={val => setSettings(p => ({ ...p, address: val }))}
                />
                <InputField
                    label="Emri i Imamit"
                    value={settings.imamName}
                    onChange={val => setSettings(p => ({ ...p, imamName: val }))}
                />
                <div className="space-y-6">
                    <label className="text-emerald-500 font-black uppercase text-xl tracking-[0.2em] px-4">Sabahu (Minuta para Lindjes)</label>
                    <div className="relative group">
                        <input
                            type="number"
                            min="0"
                            max="60"
                            value={settings.durations?.sabahuOffset ?? 35}
                            onChange={(e) => setSettings(p => ({
                                ...p,
                                durations: { ...p.durations, sabahuOffset: Math.max(0, parseInt(e.target.value) || 0) }
                            }))}
                            className="w-full glass-input py-9 px-10 text-emerald-400 text-4xl font-black outline-none font-mono tracking-tight"
                        />
                    </div>
                </div>
                <div className="space-y-6 col-span-2">
                    <label className="text-emerald-500 font-black uppercase text-xl tracking-[0.2em] px-4">Linku i QR Kodit</label>
                    <div className="relative group">
                        <HiGlobeAlt className="absolute left-8 top-1/2 -translate-y-1/2 text-5xl text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            value={settings.qrUrl}
                            onChange={(e) => setSettings(p => ({ ...p, qrUrl: e.target.value }))}
                            className="w-full glass-input py-9 pl-24 pr-10 text-emerald-400 text-3xl font-bold outline-none font-mono tracking-tight"
                        />
                    </div>
                </div>

                <div className="col-span-2 p-10 bg-white/5 rounded-[3rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex items-center justify-between mt-4">
                    <div>
                        <h4 className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">Shfaq QR Kodin</h4>
                        <p className="text-xl text-zinc-500 mt-1 font-medium italic opacity-70">Aktivizoni ose çaktivizoni shfaqjen e QR Kodit në ekran.</p>
                    </div>
                    <button
                        onClick={() => setSettings(p => ({ ...p, showQr: !p.showQr }))}
                        className={`w-32 h-14 rounded-full relative transition-all duration-500 shadow-2xl ${settings.showQr !== false ? 'bg-emerald-500 ring-8 ring-emerald-500/20' : 'bg-zinc-800'}`}
                    >
                        <div className={`absolute top-1.5 w-11 h-11 rounded-full bg-white transition-all duration-500 shadow-lg ${settings.showQr !== false ? 'translate-x-[4.5rem] shadow-emerald-900/40' : 'translate-x-0'}`} style={{ left: '0.4rem' }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function DurationsSection({ settings, setSettings, triggerConfirm, onReset }) {
    const fields = [
        { id: 'hadithRefresh', label: 'Rifreskimi i Hadithit / Ajetit', desc: 'Koha për përditësimin automatik të Hadithit / Ajetit.' },
        { id: 'hadith', label: 'Hadithi / Ajeti', desc: 'Sa kohë të qëndrojë Hadithi / Ajeti i shfaqur.' },
        { id: 'qr', label: 'QR Kodi', desc: 'Koha e shfaqjes së QR Code për skanim.' },
        { id: 'notification', label: 'Njoftimi Special', desc: 'Sa kohë të shfaqet mesazhi juaj i lënë.' },
        { id: 'announcement', label: 'Festat / Shënimet', desc: 'Koha për shfaqjen e festave dhe shënimeve nga kalendari.' }
    ];

    return (
        <div className="space-y-16">
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

            <div className="grid grid-cols-3 gap-10">
                {fields.map(f => (
                    <div key={f.id} className="p-8 bg-white/5 rounded-[3rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all duration-500 group">
                        <div className="flex flex-col gap-6 mb-4">
                            <h4 className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors tracking-tighter uppercase leading-tight">{f.label}</h4>
                            <div className="flex items-baseline gap-3">
                                <input
                                    type="number"
                                    min="0"
                                    value={settings.durations[f.id] > 1000 ? Math.round(settings.durations[f.id] / 60000) : (settings.durations[f.id] || 0)}
                                    onChange={(e) => setSettings(p => ({
                                        ...p,
                                        durations: { ...p.durations, [f.id]: Math.max(0, Number(e.target.value)) }
                                    }))}
                                    className="w-28 bg-black/60 text-center border-b-4 border-zinc-800 text-5xl font-black text-emerald-400 py-4 focus:border-emerald-500 outline-none transition-all font-mono"
                                />
                                <span className="text-zinc-600 font-black uppercase text-xl tracking-widest">min</span>
                            </div>
                        </div>
                        <p className="text-2xl text-zinc-500 font-medium leading-relaxed italic opacity-80">"{f.desc}"</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RamazanSection({ settings, setSettings, triggerConfirm, onReset }) {
    const hourRef = useRef(null);
    const minRef = useRef(null);

    // Parse existing time HH:MM
    const fullTime = settings.ramazan?.kohaTeravise || "";
    const [initialH, initialM] = fullTime.includes(':') ? fullTime.split(':') : ["", ""];

    // Use local state for immediate typing to avoid jumpy padding
    const [h, setH] = useState(initialH);
    const [m, setM] = useState(initialM);

    // Sync from props if settings change externally
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

        // Sync to global state without forced padding while typing
        // This stops "1" from becoming "01" immediately
        const hStr = newH || "00";
        const mStr = newM || "00";

        setSettings(p => ({
            ...p,
            ramazan: { ...(p.ramazan || {}), kohaTeravise: `${hStr}:${mStr}` }
        }));
    };

    return (
        <div className="space-y-16">
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

            <div className="grid grid-cols-2 gap-12">
                <div className="p-12 bg-white/5 rounded-[4rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col gap-12">
                    <div className="text-center">
                        <h4 className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">Statusi i Ramazanit</h4>
                        <p className="text-xl text-zinc-500 mt-2 font-medium italic opacity-70">Zgjidhni gjendjen aktuale të shfaqjes për muajin Ramazan.</p>
                    </div>
                    <div className="flex bg-zinc-900 p-3 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-50" />
                        <button
                            onClick={() => setSettings(p => ({ ...p, ramazan: { ...(p.ramazan || {}), active: false } }))}
                            className={`flex-1 py-10 rounded-[2.5rem] font-black text-3xl uppercase tracking-widest transition-all duration-500 relative z-10 ${!settings.ramazan?.active ? 'bg-zinc-800 text-white shadow-premium scale-[1.02] border border-white/10' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            Jo Aktiv
                        </button>
                        <button
                            onClick={() => setSettings(p => ({ ...p, ramazan: { ...(p.ramazan || {}), active: true } }))}
                            className={`flex-1 py-10 rounded-[2.5rem] font-black text-3xl uppercase tracking-widest transition-all duration-500 relative z-10 ${settings.ramazan?.active ? 'bg-emerald-500 text-black shadow-[0_0_60px_rgba(16,185,129,0.5)] scale-[1.02]' : 'text-zinc-600 hover:text-emerald-500/50'}`}
                        >
                            Aktiv
                        </button>
                    </div>
                </div>

                <div className="p-12 bg-white/5 rounded-[4rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group">
                    <h4 className="text-4xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight mb-8 text-center">Koha e Faljes së Teravisë</h4>
                    <div className="flex items-center justify-center gap-6">
                        <div className="flex flex-col items-center gap-4">
                            <input
                                ref={hourRef}
                                type="number"
                                min="0"
                                max="23"
                                placeholder="00"
                                value={h}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length > 2) val = val.slice(0, 2);
                                    const num = parseInt(val);
                                    if (num > 23) val = "23";
                                    handleTimeUpdate(val, m);
                                    if (val.length === 2 || (val.length === 1 && parseInt(val) > 2)) minRef.current?.focus();
                                }}
                                className="w-32 bg-black/40 border-b-4 border-zinc-800 py-8 text-white text-6xl font-black outline-none font-mono text-center tracking-tighter focus:border-emerald-500 transition-all rounded-2xl"
                            />
                            <span className="text-zinc-500 font-bold uppercase text-sm tracking-widest">Ora</span>
                        </div>

                        <span className="text-6xl font-black text-white/20 pb-8">:</span>

                        <div className="flex flex-col items-center gap-4">
                            <input
                                ref={minRef}
                                type="number"
                                min="0"
                                max="59"
                                placeholder="00"
                                value={m}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length > 2) val = val.slice(0, 2);
                                    const num = parseInt(val) || 0;
                                    if (num > 59) val = "59";
                                    handleTimeUpdate(h, val);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Backspace' && !m) hourRef.current?.focus();
                                }}
                                className="w-32 bg-black/40 border-b-4 border-zinc-800 py-8 text-white text-6xl font-black outline-none font-mono text-center tracking-tighter focus:border-emerald-500 transition-all rounded-2xl"
                            />
                            <span className="text-zinc-500 font-bold uppercase text-sm tracking-widest">Minuta</span>
                        </div>
                    </div>
                    <p className="text-xl text-zinc-500 mt-6 text-center italic font-medium opacity-60">Lëreni 00:00 për ta ndjekur Jacinë.</p>
                </div>
            </div>
        </div>
    );
}

function MessageSection({ settings, setSettings, triggerConfirm, onReset }) {
    return (
        <div className="space-y-16">
            <SectionHeader
                icon={HiSpeakerphone}
                title="Njoftimi"
                description="Mesazhi personal që do të shfaqet në ekran gëjatë ciklit të informacioneve."
                onReset={() => triggerConfirm(
                    "Fshi Njoftimin",
                    "A dëshironi të fshini plotësisht mesazhin e shënuar?",
                    onReset
                )}
                resetLabel="Fshi"
            />

            <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <textarea
                    value={settings.customMsg}
                    onChange={(e) => setSettings(p => ({ ...p, customMsg: e.target.value }))}
                    placeholder="Shkruani këtu njoftimin për xhematin (psh: Programi i javës, Ligjërata, etj)..."
                    className="w-full h-96 glass-input p-16 text-white text-5xl font-black outline-none resize-none leading-tight relative z-10 placeholder:text-zinc-800 hover:border-emerald-500/30 transition-all focus:h-[30rem] duration-500"
                />
            </div>
            <p className="text-3xl text-zinc-600 italic text-center px-24 leading-relaxed">Ky njoftim do të shfaqet sipas kohës që keni caktuar te menuja e kohëzgjatjes.</p>
        </div>
    );
}

function InputField({ label, value, onChange }) {
    return (
        <div className="space-y-4">
            <label className="text-emerald-500 font-black uppercase text-sm tracking-[0.2em] px-4">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full glass-input py-6 px-8 text-white text-3xl font-black outline-none hover:border-emerald-500/30 transition-all rounded-[1.5rem]"
            />
        </div>
    );
}
