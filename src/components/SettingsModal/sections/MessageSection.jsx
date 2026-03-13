import { HiSpeakerphone } from "react-icons/hi";
import { SectionHeader } from "./shared";

export default function MessageSection({ settings, setSettings, triggerConfirm, onReset }) {
    return (
        <div className="space-y-16">
            <SectionHeader
                icon={HiSpeakerphone}
                title="Njoftimi"
                description="Mesazhi personal që do të shfaqet në ekran gjatë ciklit të informacioneve."
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
