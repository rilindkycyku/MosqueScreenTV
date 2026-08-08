import { memo } from 'react';

const BN = { fontFamily: "'Bebas Neue', sans-serif" };

const NextPrayer = memo(function NextPrayer({ infoTani, ne24hFn, formatDallimFn, settings, compact }) {
    if (!infoTani?.ardhshëm) {
        return (
            <div className="bg-zinc-900/80 backdrop-blur-sm border-2 border-white/5 rounded-[3.5rem] p-4 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
                <p className="text-zinc-400 animate-pulse text-2xl font-bold uppercase tracking-widest">Duke u përditësuar...</p>
            </div>
        );
    }

    const { isSilenceMode } = infoTani || {};
    const showSilence = settings?.showSilenceWarning !== false;
    const isXh = infoTani.ardhshëm.isXh;
    const labelMain = infoTani.ardhshëm.label.replace('ME XHEMAT: ', '');

    // Compact variant: the short, wide strip this takes when it swaps places
    // with the prayer-times grid during a silence window. The tall-card sizes
    // below (up to text-[17rem]) badly overflow that shape, so this is a
    // separate, single-row layout sized for it instead of reusing them.
    if (compact) {
        const displayName = labelMain.split(' (')[0];
        // Full-width strip has room the square card doesn't — size both the
        // name and the countdown off their own text length so short labels
        // (the common case) fill the height instead of leaving it mostly empty.
        const nameSize = displayName.length > 10 ? 'text-9xl' : displayName.length > 7 ? 'text-[13rem]' : 'text-[15rem]';
        const countdownStr = formatDallimFn(infoTani.mbetur);
        const countdownSize = countdownStr.replace(/\s/g, '').length > 5 ? 'text-9xl' : 'text-[15rem]';
        // Stretched vertically (not scaled up) to eat the leftover gap below the
        // baseline without widening the glyphs — growing font-size further would
        // also grow width and start overflowing long names/countdowns.
        const tallStyle = { ...BN, transform: 'scaleY(1.22)', transformOrigin: 'top' };
        return (
            <div className="next-prayer-box bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-[3.5rem] px-20 relative overflow-hidden flex items-center justify-between h-full shadow-2xl">
                <div className="flex items-center gap-12 min-w-0">
                    <div className={`w-8 h-8 rounded-full shrink-0 ${isXh ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600'}`} />
                    <div className="flex flex-col min-w-0">
                        <p className="text-emerald-500 font-bold uppercase tracking-[0.3em] text-3xl leading-none mb-4">Vakti i radhës</p>
                        <h2 className={`font-bold text-white tracking-[0.03em] uppercase leading-none whitespace-nowrap ${nameSize}`} style={tallStyle}>
                            {displayName}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-10 shrink-0">
                    <p className="text-zinc-400 text-5xl uppercase font-bold tracking-widest leading-[1.05] text-right" style={BN}>
                        koha e <br /> mbetur
                    </p>
                    <div className={`${countdownSize} font-bold tabular-nums leading-none whitespace-nowrap ${infoTani.mbetur <= 15 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} style={tallStyle}>
                        {countdownStr}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`next-prayer-box bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-[3.5rem] p-2 relative overflow-hidden flex flex-col transition-all duration-500 h-full ${isSilenceMode && showSilence ? 'shadow-[0_0_50px_rgba(245,158,11,0.1)]' : 'shadow-2xl'}`}>
            {/* Silence Mode Overlay */}
            {showSilence && (
                <div className={`absolute top-0 right-0 ${isSilenceMode ? 'bg-amber-500 animate-pulse' : 'bg-zinc-800'} w-24 h-24 rounded-bl-[2.5rem] shadow-lg flex items-center justify-center z-20 transition-colors duration-500`}>
                    <svg className={`w-14 h-14 shrink-0 ${isSilenceMode ? 'text-black' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            <div className="relative z-10 w-full h-full flex flex-col justify-between px-10 pt-4 pb-4 animate-slide-up">
                {/* 1. Header — Top Aligned */}
                <div className="w-full flex flex-col items-center">
                    <div className="flex items-center gap-4 mb-1 opacity-80">
                        <div className={`w-3 h-3 rounded-full ${isXh ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600'}`} />
                        <p className="text-emerald-500 font-bold uppercase tracking-[0.4em] text-2xl">
                            Vakti i radhës
                        </p>
                    </div>
                </div>

                {/* 2 & 3. Grouped Content — 2/3 Label (Name) and 1/3 Time Left (Countdown) */}
                <div className="flex-1 flex flex-col justify-between items-center py-2 h-full">
                    {/* Prayer Name — 2/3 Height */}
                    <div className="flex-[2] flex flex-col justify-center items-center min-h-0 w-full overflow-hidden">
                        {(() => {
                            const displayName = labelMain.split(' (')[0];
                            const hasSubLabel = labelMain.includes('(');
                            const len = displayName.length;

                            // Dynamic size calculation: base size decreases with length and presence of sub-label
                            const sizeClass =
                                len > 12 ? (hasSubLabel ? 'text-[7.5rem]' : 'text-[9rem]')
                                    : len > 10 ? (hasSubLabel ? 'text-[9rem]' : 'text-[11rem]')
                                        : len > 8 ? (hasSubLabel ? 'text-[11rem]' : 'text-[13rem]')
                                            : len > 6 ? (hasSubLabel ? 'text-[13rem]' : 'text-[15rem]')
                                                : (hasSubLabel ? 'text-[14rem]' : 'text-[17rem]');
                            return (
                                <h2 className={`font-bold text-white tracking-[0.05em] uppercase leading-[0.8] text-center whitespace-nowrap ${sizeClass}`} style={BN}>
                                    {displayName}
                                </h2>
                            );
                        })()}
                        {labelMain.includes('(') && (
                            <p className="text-[5rem] text-emerald-500 font-bold -mt-4 uppercase tracking-[0.3em] opacity-90 leading-none text-center" style={BN}>
                                {labelMain.split('(')[1].replace(')', '')}
                            </p>
                        )}
                    </div>

                    {/* Bottom Info Row — 1/3 Height */}
                    <div className="flex-1 flex flex-col justify-end w-full mt-6 min-h-0">
                        <div className="h-px w-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-transparent mb-6 opacity-30" />
                        <div className="flex w-full items-center justify-center">
                            <div className="w-1/3 flex flex-col items-end pr-6 border-r-2 border-zinc-800/80">
                                <p className="text-zinc-400 text-[3.2rem] uppercase font-bold tracking-widest leading-[1.05] text-right" style={BN}>
                                    koha e <br /> mbetur
                                </p>
                            </div>
                            <div className="w-2/3 flex items-center pl-6">
                                <div className={`text-[13rem] font-bold tabular-nums leading-none whitespace-nowrap ${infoTani.mbetur <= 15 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} style={BN}>
                                    {formatDallimFn(infoTani.mbetur)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default NextPrayer;
