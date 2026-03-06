import { memo } from 'react';

const NextPrayer = memo(function NextPrayer({ infoTani, ne24hFn, formatDallimFn, settings }) {
    if (!infoTani?.ardhshëm) {
        return (
            <div className="bg-zinc-900/80 backdrop-blur-sm border-2 border-white/5 rounded-[3.5rem] p-10 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
                <p className="text-zinc-500 animate-pulse text-2xl font-black uppercase tracking-widest">Duke u përditësuar...</p>
            </div>
        );
    }

    const { isSilenceMode } = infoTani || {};
    const showSilence = settings?.showSilenceWarning !== false;
    const isXh = infoTani.ardhshëm.isXh;
    const labelMain = infoTani.ardhshëm.label.replace('ME XHEMAT: ', '');

    return (
        <div className={`bg-zinc-900 rounded-[3.5rem] p-10 relative overflow-hidden flex flex-col justify-center transition-all duration-500 ${isSilenceMode && showSilence ? 'shadow-[0_0_50px_rgba(245,158,11,0.1)]' : 'shadow-2xl'}`}>
            <div className="relative z-10 w-full animate-slide-up">
                <div className="flex justify-between items-center mb-4 w-full gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-3 h-3 rounded-full animate-pulse ${isXh ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
                            <p className={`${isXh ? 'text-emerald-400' : 'text-emerald-600'} font-black uppercase tracking-[0.5em] text-xl`}>
                                Vakti i radhës
                            </p>
                        </div>
                        <h2 className="text-7xl lg:text-[7.5rem] font-black text-white tracking-[0.05em] uppercase leading-[0.9] pr-4">
                            {labelMain.split(' ')[0]}
                        </h2>
                        {labelMain.includes('(') && (
                            <p className="text-3xl text-emerald-500/80 font-black mt-2 uppercase tracking-[0.3em] opacity-80 leading-tight">
                                {labelMain.split('(')[1].replace(')', '')}
                            </p>
                        )}
                    </div>

                    {showSilence && (
                        <div className={`${isSilenceMode ? 'bg-amber-500 animate-pulse' : 'bg-zinc-800'} w-32 h-32 rounded-[2.5rem] shadow-lg flex items-center justify-center flex-shrink-0 transition-colors duration-500`}>
                            <svg className={`w-20 h-20 shrink-0 ${isSilenceMode ? 'text-black' : 'text-zinc-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="h-px w-full bg-gradient-to-r from-zinc-800 via-zinc-800 to-transparent mb-4 opacity-50" />
                <div className="flex justify-between items-end w-full">
                    <div className="flex flex-col">
                        <p className="text-zinc-500 text-sm uppercase font-black tracking-widest mb-4 flex items-center gap-4">Koha e mbetur <span className="w-12 h-px bg-zinc-800/50" /></p>
                        <div className={`text-7xl lg:text-[6.5rem] font-black tabular-nums italic leading-none whitespace-nowrap ${infoTani.mbetur <= 15 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                            {formatDallimFn(infoTani.mbetur)}
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-zinc-500 text-sm uppercase font-black tracking-widest mb-4">Koha</p>
                        <div className={`${isXh ? 'bg-emerald-400 text-black' : 'bg-zinc-800 text-white'} px-10 py-6 rounded-[2.5rem] font-mono text-6xl lg:text-7xl font-black shadow-lg`}>
                            {ne24hFn(infoTani.ardhshëm.kohe)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default NextPrayer;
