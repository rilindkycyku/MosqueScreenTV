import { HiRefresh } from "react-icons/hi";

/** Reusable section header with icon, title, description and optional reset button */
export function SectionHeader({ icon: Icon, title, description, onReset, resetLabel = "Reset" }) {
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

/** Labelled text input styled for TV display */
export function InputField({ label, value, onChange }) {
    return (
        <div className="space-y-6">
            <label className="text-emerald-500 font-black uppercase text-2xl tracking-[0.2em] px-4 leading-none">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full glass-input py-9 px-10 text-white text-4xl font-black outline-none hover:border-emerald-500/30 transition-all rounded-[2.5rem]"
            />
        </div>
    );
}
