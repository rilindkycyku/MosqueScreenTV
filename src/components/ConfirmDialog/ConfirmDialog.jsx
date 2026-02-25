import { HiRefresh } from "react-icons/hi";

export default function ConfirmDialog({ show, config, onCancel }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-white/10 p-12 rounded-[3.5rem] w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center gap-8">
                    <div className="p-6 bg-red-500/10 rounded-full border border-red-500/20">
                        <HiRefresh className="text-6xl text-red-500 animate-spin-slow" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-4">{config.title}</h2>
                        <p className="text-zinc-400 text-2xl leading-relaxed">{config.message}</p>
                    </div>
                    <div className="flex gap-6 w-full pt-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-6 bg-zinc-800 text-zinc-400 rounded-3xl font-black text-xl uppercase tracking-widest hover:bg-zinc-700 transition-all border border-white/5"
                        >
                            Anulo
                        </button>
                        <button
                            onClick={config.action}
                            className="flex-1 py-6 bg-red-600 text-white rounded-3xl font-black text-xl uppercase tracking-widest hover:bg-red-500 transition-all shadow-2xl shadow-red-600/20"
                        >
                            Vazhdo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
