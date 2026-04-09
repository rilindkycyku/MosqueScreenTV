import { HiIdentification, HiCheckCircle } from "react-icons/hi";
import { SectionHeader, InputField } from "./shared";
import profiles from "../../../data/profiles.json";

export default function IdentitySection({ settings, setSettings, triggerConfirm, onReset }) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <SectionHeader
                icon={HiIdentification}
                title="Identiteti"
                description="Informacionet kryesore të xhamisë dhe imamit."
                onReset={() => triggerConfirm(
                    "Rikthe Identitetin",
                    "A dëshironi t'i ktheni të dhënat e identitetit në vlerat fillestare?",
                    onReset
                )}
            />

            {settings.appMode === 'mosque' ? (
                <div className="grid grid-cols-1 gap-12">
                    {Object.keys(profiles).length > 0 && (
                        <div className="w-full flex flex-col gap-3">
                            <label className="text-xl font-bold uppercase tracking-widest text-zinc-400">
                                Zgjidh nga lista
                            </label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-zinc-900 border-2 border-white/10 rounded-[1.5rem] p-5 text-2xl font-bold text-white outline-none focus:border-emerald-500/50 appearance-none transition-all cursor-pointer shadow-inner"
                                    onChange={(e) => {
                                        const profile = profiles[e.target.value];
                                        if (profile) {
                                            setSettings(p => ({
                                                ...p,
                                                name: profile.name ?? p.name,
                                                address: profile.address ?? p.address,
                                                imamName: profile.imamName ?? p.imamName,
                                                location: profile.location ?? p.location,
                                                manualDreka: profile.manualDreka ?? p.manualDreka,
                                                manualXhuma1: profile.manualXhuma1 ?? p.manualXhuma1,
                                                manualXhuma2: profile.manualXhuma2 ?? p.manualXhuma2,
                                                xhuma2Active: profile.xhuma2Active ?? p.xhuma2Active,
                                                appMode: profile.appMode ?? p.appMode,
                                                showQr: profile.showQr ?? p.showQr,
                                                qrUrl: profile.qrUrl ?? p.qrUrl,
                                                showFooter: profile.showFooter ?? p.showFooter,
                                                showSilenceWarning: profile.showSilenceWarning ?? p.showSilenceWarning,
                                                showQuranRadio: profile.showQuranRadio ?? p.showQuranRadio,
                                                durations: {
                                                    ...p.durations,
                                                    ...(profile.durations || {})
                                                },
                                                iqamah: {
                                                    ...p.iqamah,
                                                    ...(profile.iqamah || {})
                                                },
                                                ramazan: {
                                                    ...p.ramazan,
                                                    ...(profile.ramazan || {})
                                                }
                                            }));
                                        }
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Zgjidh profilin --</option>
                                    {Object.entries(profiles).map(([key, profile]) => (
                                        <option key={key} value={key}>
                                            {profile.name} ({profile.address})
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute top-0 right-0 h-full flex items-center pr-6 pointer-events-none">
                                    <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            <p className="text-zinc-500 text-base font-medium mt-2 p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                <span className="opacity-70">A nuk po e gjeni xhaminë tuaj? Zgjidhni formatin manual më poshtë ose na kontaktoni në </span>
                                <a href="https://rilindkycyku.dev" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-400 font-bold underline decoration-emerald-500/30 underline-offset-4 transition-all">rilindkycyku.dev</a>
                                <span className="opacity-70"> për ta shtuar në listë.</span>
                            </p>
                        </div>
                    )}
                    
                    <div className="w-full bg-white/5 h-[2px] rounded-full my-2"></div>

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
                </div>
            ) : (
                <div className="p-10 bg-emerald-500/10 rounded-[2.5rem] border-2 border-emerald-500/20 flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)]">
                        <HiCheckCircle className="text-4xl text-black" />
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Mënyra Shtëpi Aktive</h3>
                    <p className="text-lg text-zinc-400 font-medium max-w-2xl italic">Në këtë mënyrë, vaktet merren direkt siç janë në kalendar pa vonesa dhe emrat e xhamisë fshihen automatikusht.</p>
                </div>
            )}
        </div>
    );
}
