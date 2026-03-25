import { memo } from 'react';

const NextPrayer = memo(function NextPrayer({ infoTani, ne24hFn, formatDallimFn, settings }) {
    if (!infoTani?.ardhshëm) {
        return (
            <div className="bg-zinc-900/80 backdrop-blur-sm border-2 border-white/5 rounded-[3.5rem] p-4 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
                <p className="text-zinc-500 animate-pulse text-2xl font-black uppercase tracking-widest">Duke u përditësuar...</p>
            </div>
        );
    }

    const { isSilenceMode } = infoTani || {};
    const showSilence = settings?.showSilenceWarning !== false;
    const isXh = infoTani.ardhshëm.isXh;
    const labelMain = infoTani.ardhshëm.label.replace('ME XHEMAT: ', '');

    return (
        <div className={`bg-zinc-900 rounded-[3.5rem] p-2 relative overflow-hidden flex flex-col transition-all duration-500 ${isSilenceMode && showSilence ? 'shadow-[0_0_50px_rgba(245,158,11,0.1)]' : 'shadow-2xl'}`}>
            {/* Silence Mode Overlay */}
            {showSilence && (
                <div className={`absolute top-0 right-0 ${isSilenceMode ? 'bg-amber-500 animate-pulse' : 'bg-zinc-800'} w-24 h-24 rounded-bl-[2.5rem] shadow-lg flex items-center justify-center z-20 transition-colors duration-500`}>
                    <svg className={`w-14 h-14 shrink-0 ${isSilenceMode ? 'text-black' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            <div className="relative z-10 w-full h-full flex flex-col justify-between px-10 pt-4 pb-8 animate-slide-up">
                {/* 1. Symmetric Header */}
                <div className="w-full flex flex-col items-center pt-2">
                    <div className="flex items-center gap-4 mb-2 opacity-80">
                        <div className={`w-3 h-3 rounded-full ${isXh ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600'}`} />
                        <p className="text-emerald-500 font-black uppercase tracking-[0.4em] text-2xl">
                            Vakti i radhës
                        </p>
                    </div>
                </div>

                {/* 2. Scalable Center Content */}
                <div className="flex-1 flex flex-col justify-center items-center py-4">
                    <h2 className={`font-black text-white tracking-[0.05em] uppercase leading-[0.85] text-center ${labelMain.length > 10 ? 'text-6xl lg:text-[7rem]' : 'text-7xl lg:text-[8.5rem]'}`}>
                        {labelMain.split(' (')[0]}
                    </h2>
                    {labelMain.includes('(') && (
                        <p className="text-3xl text-emerald-500/80 font-black mt-2 uppercase tracking-[0.3em] opacity-80 leading-tight text-center">
                            {labelMain.split('(')[1].replace(')', '')}
                        </p>
                    )}
                </div>

                {/* 3. Bottom Info Row */}
                <div className="w-full">
                    <div className="h-px w-full bg-gradient-to-r from-zinc-800 via-zinc-800 to-transparent mb-3 opacity-30" />
                    <div className="flex justify-between items-end">
                        <div className="flex-col">
                            <p className="text-zinc-500 text-xs uppercase font-black tracking-[0.2em] mb-1 flex items-center gap-4">Koha e mbetur <span className="w-8 h-px bg-zinc-800/50" /></p>
                            <div className={`text-6xl lg:text-[5.5rem] font-black tabular-nums italic leading-none whitespace-nowrap ${infoTani.mbetur <= 15 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                                {formatDallimFn(infoTani.mbetur)}
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-zinc-500 text-xs uppercase font-black tracking-[0.2em] mb-1">Fillon në</p>
                            <div className={`${isXh ? 'bg-emerald-400 text-black' : 'bg-zinc-800 text-white'} px-8 py-4 rounded-[2rem] font-mono text-5xl lg:text-[4.5rem] font-black shadow-lg`}>
                                {ne24hFn(infoTani.ardhshëm.kohe)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default NextPrayer;
