import { HiSpeakerphone } from "react-icons/hi";
import { SectionHeader } from "./shared";

export default function MessageSection({ settings, setSettings, triggerConfirm, onReset }) {
    return (
        <div className="space-y-10">
            <SectionHeader
                icon={HiSpeakerphone}
                title="Njoftimi"
                description="Mesazhi personal për ekranin."
                onReset={() => triggerConfirm(
                    "Fshi Njoftimin",
                    "A dëshironi të fshini plotësisht mesazhin e shënuar?",
                    onReset
                )}
                resetLabel="Fshi"
            />

            <div className="relative group">
                <textarea
                    value={settings.customMsg}
                    onChange={(e) => setSettings(p => ({ ...p, customMsg: e.target.value }))}
                    placeholder="Shkruani këtu njoftimin..."
                    className="w-full h-64 glass-input p-10 text-white text-3xl font-black outline-none resize-none leading-tight relative z-10 placeholder:text-zinc-800 hover:border-emerald-500/30 transition-all focus:h-[20rem] duration-500"
                />
            </div>
            <p className="text-xl text-zinc-600 italic text-center px-12 leading-relaxed">Ky njoftim shfaqet sipas kohës së caktuar.</p>
        </div>
    );
}
