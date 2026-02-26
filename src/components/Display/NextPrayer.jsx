import { memo } from 'react';

const NextPrayer = memo(function NextPrayer({ infoTani, ne24hFn, formatDallimFn }) {
    if (!infoTani?.ardhshëm) {
        return (
            <div className="bg-zinc-900/80 backdrop-blur-sm border-2 border-white/5 rounded-[3.5rem] p-12 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
                <p className="text-zinc-500 animate-pulse text-2xl font-black uppercase tracking-widest">Duke u përditësuar...</p>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/80 backdrop-blur-sm border-2 border-white/5 rounded-[3.5rem] p-12 relative overflow-hidden flex flex-col justify-center shadow-2xl">
            <div className="relative z-10 w-full">
                <div className="flex justify-between items-start mb-8 w-full">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-emerald-500 font-black uppercase tracking-[0.4em] text-xl">Vakti i radhës</p>
                        </div>
                        <h2 className="text-8xl lg:text-9xl font-black text-white tracking-tighter uppercase leading-none">
                            {infoTani.ardhshëm.label.split(' ')[0]}
                        </h2>
                        {infoTani.ardhshëm.label.includes('(') && (
                            <p className="text-3xl text-emerald-500/80 font-black mt-2 uppercase tracking-widest">
                                {infoTani.ardhshëm.label.split('(')[1].replace(')', '')}
                            </p>
                        )}
                    </div>
                    <div className="bg-emerald-500 text-black px-10 py-8 rounded-[3rem] font-mono text-6xl lg:text-7xl font-black border-4 border-emerald-400/30 shadow-2xl">
                        {ne24hFn(infoTani.ardhshëm.kohe)}
                    </div>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-zinc-800 via-zinc-800 to-transparent mb-8" />
                <div className="flex flex-col">
                    <p className="text-zinc-500 text-sm uppercase font-black tracking-widest mb-6 flex items-center gap-4">Koha e mbetur <span className="flex-1 h-px bg-zinc-800/50" /></p>
                    <div className={`text-7xl lg:text-8xl xl:text-9xl font-black tabular-nums tracking-tighter italic leading-none whitespace-nowrap ${infoTani.mbetur <= 15 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                        {formatDallimFn(infoTani.mbetur)}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default NextPrayer;

