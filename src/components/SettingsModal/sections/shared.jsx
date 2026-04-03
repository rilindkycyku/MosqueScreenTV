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
export function InputField({ label, value, onChange, placeholder = "" }) {
    return (
        <div className="space-y-6">
            <label className="text-emerald-500 font-black uppercase text-2xl tracking-[0.2em] px-4 leading-none">{label}</label>
            <input
                type="text"
                value={value}
                spellCheck="false"
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-black/40 border-2 border-white/5 py-9 px-10 text-white text-4xl font-black outline-none focus:border-emerald-500/50 hover:border-emerald-500/30 transition-all rounded-[2.5rem] shadow-inner"
            />
        </div>
    );
}

/** Specialized numeric input with unit */
export function NumberInput({ label, value, onChange, unit = "Min", description }) {
    return (
        <div className="p-10 bg-white/5 rounded-[3rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col items-center justify-center shadow-2xl relative overflow-hidden h-full">
            <div className="absolute inset-0 bg-emerald-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
            <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight mb-8 text-center relative z-10">{label}</h4>
            <div className="flex items-center gap-6 relative z-10">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-32 bg-black/40 border-2 border-zinc-800/50 py-6 text-white text-5xl font-black outline-none font-mono text-center tracking-tighter focus:border-emerald-500 transition-all rounded-[1.5rem] shadow-inner"
                />
                <span className="text-zinc-500 font-black uppercase text-2xl tracking-widest opacity-40">{unit}</span>
            </div>
            {description && <p className="text-sm text-zinc-500 mt-6 text-center italic font-medium opacity-60 px-4 leading-relaxed relative z-10">{description}</p>}
        </div>
    );
}

/** Specialized time input with hour/minute boxes */
export function TimePicker({ label, value, onChange, description, isOffset = false, unit = "Min" }) {
    if (isOffset) {
        return <NumberInput label={label} value={value} onChange={onChange} unit={unit} description={description} />;
    }

    // Treat empty string as 00:00 for the UI boxes, but track it separately
    const [h, m] = (value && value.includes(':')) ? value.split(':') : ["", ""];
    
    const updateTime = (newH, newM) => {
        if (!newH && !newM) {
            onChange("");
            return;
        }
        const hourTxt = (newH || "00").padStart(2, '0');
        const minTxt = (newM || "00").padStart(2, '0');
        onChange(`${hourTxt}:${minTxt}`);
    };

    return (
        <div className="p-10 bg-white/5 rounded-[3rem] border-2 border-white/5 hover:border-emerald-500/40 transition-all group flex flex-col items-center justify-center shadow-2xl relative overflow-hidden h-full">
             <div className="absolute inset-0 bg-emerald-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
             
            <h4 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight mb-8 text-center relative z-10">{label}</h4>
            
            <div className="flex items-center justify-center gap-6 relative z-10">
                <div className="flex flex-col items-center gap-3">
                    <input
                        type="number" min="0" max="23" placeholder="00" value={h}
                        onChange={(e) => {
                            let val = e.target.value;
                            if (val.length > 2) val = val.slice(0, 2);
                            if (parseInt(val) > 23) val = "23";
                            updateTime(val, m);
                        }}
                        className="w-28 bg-black/40 border-2 border-zinc-800/50 py-6 text-white text-5xl font-black outline-none font-mono text-center tracking-tighter focus:border-emerald-500 transition-all rounded-[1.5rem] shadow-inner"
                    />
                    <span className="text-zinc-500 font-bold uppercase text-xs tracking-widest opacity-50">Ora</span>
                </div>
                
                <span className="text-5xl font-black text-white/10 mb-8">:</span>
                
                <div className="flex flex-col items-center gap-3">
                    <input
                        type="number" min="0" max="59" placeholder="00" value={m}
                        onChange={(e) => {
                            let val = e.target.value;
                            if (val.length > 2) val = val.slice(0, 2);
                            if ((parseInt(val) || 0) > 59) val = "59";
                            updateTime(h, val);
                        }}
                        className="w-28 bg-black/40 border-2 border-zinc-800/50 py-6 text-white text-5xl font-black outline-none font-mono text-center tracking-tighter focus:border-emerald-500 transition-all rounded-[1.5rem] shadow-inner"
                    />
                    <span className="text-zinc-500 font-bold uppercase text-xs tracking-widest opacity-50">Minuta</span>
                </div>
            </div>
            
            {description && <p className="text-sm text-zinc-500 mt-6 text-center italic font-medium opacity-60 px-4 leading-relaxed relative z-10">{description}</p>}
        </div>
    );
}
