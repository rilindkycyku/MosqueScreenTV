import { HiIdentification, HiCheckCircle } from "react-icons/hi";
import { SectionHeader, InputField } from "./shared";

export default function IdentitySection({ settings, setSettings, triggerConfirm, onReset }) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <SectionHeader
                icon={HiIdentification}
                title="Identiteti"
                description="Informacionet kryesore të ekranit."
                onReset={() => triggerConfirm(
                    "Rikthe Identitetin",
                    "A dëshironi t'i ktheni të dhënat në vlerat fillestare?",
                    onReset
                )}
            />

            {settings.appMode === 'mosque' ? (
                <div className="grid grid-cols-1 gap-8">
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
