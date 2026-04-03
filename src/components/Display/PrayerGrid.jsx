import { memo, useMemo } from 'react';

const PrayerGrid = memo(function PrayerGrid({ listaNamazeve, vaktiSot, infoTani, xhematiFn, ne24hFn, isRamazan, settings }) {
    const namazNateActive = isRamazan && settings?.ramazan?.namazNate?.active && settings?.appMode !== 'home';
    const isFriday = useMemo(() => new Date().getDay() === 5, [vaktiSot.Date]); // Only re-calc when date changes
    
    const colCount = listaNamazeve.length;
    const is6Col = colCount >= 6;
    const is7Col = colCount >= 7;

    // Optimized font sizes for 1920x1080 display
    const labelSize = is7Col ? 'text-4xl' : is6Col ? 'text-5xl' : 'text-5xl';
    const subLabelSize = is7Col ? 'text-[1.1rem]' : is6Col ? 'text-2xl' : 'text-3xl';
    const timeNoSub = is7Col ? 'text-[8.5rem]' : is6Col ? 'text-[9.5rem]' : 'text-[13rem]';
    const timeSub = is7Col ? 'text-[6rem]' : is6Col ? 'text-[7rem]' : 'text-[9rem]';
    const cardPx = is7Col ? 'px-4' : is6Col ? 'px-6' : 'px-10';
    const trackingVal = is7Col ? 'tracking-[0.1em]' : 'tracking-[0.2em]';

    return (
        <div className="prayer-grid-box flex-1 min-h-0 relative z-10" style={{ contain: 'layout style' }}>
            <div className="bg-zinc-900 rounded-[3.5rem] p-2 border border-white/5 shadow-premium h-full flex flex-col justify-center overflow-hidden">
                <div className="grid gap-2 h-full" style={{ gridTemplateColumns: `repeat(${listaNamazeve.length}, 1fr)` }}>
                    {listaNamazeve.map(({ id, label }) => {
                        const xh = xhematiFn(id);
                        const isCurrent = infoTani?.tani?.id === id;
                        const isNext = infoTani?.ardhshëm?.id === id;
                        const isJumuah = isFriday && (id === 'Dreka' || id === 'Xhuma1' || id === 'Xhuma2') && settings?.appMode !== 'home';

                        const hasLindja = id === 'Sabahu' && !isRamazan && vaktiSot.Lindja;
                        const hasNamazNate = namazNateActive && id === 'Jacia';
                        const hasSubCard = hasLindja || hasNamazNate;

                        const labelParts = label.split(' (');
                        const mainLabel = labelParts[0];
                        const subLabelText = labelParts[1] ? labelParts[1].replace(')', '') : null;

                        return (
                            <div
                                key={id}
                                className={`flex flex-col rounded-[3rem] p-0 border-2 transition-[background-color,border-color,transform,box-shadow] duration-500 relative overflow-hidden h-full
                                    ${isCurrent ? 'bg-emerald-600 border-white/60 z-10 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : isNext ? 'bg-zinc-800/80 border-emerald-500/50' : isJumuah ? 'bg-amber-900/20 border-amber-500/30' : 'bg-black/40 border-white/5'}`}
                            >
                                <div className={`relative z-10 w-full h-full flex flex-col justify-start ${cardPx} pt-4 pb-0`}>
                                    {/* Top Content Row */}
                                    <div className="flex-none flex flex-col items-center justify-start pt-1 pb-0">
                                        <div className={`${labelSize} font-bold uppercase ${trackingVal} text-center leading-none ${isCurrent ? 'text-white' : isJumuah ? 'text-amber-400' : 'text-zinc-400'}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                            {mainLabel}
                                        </div>
                                        {subLabelText && (
                                            <div className={`${subLabelSize} font-bold uppercase tracking-[0.1em] leading-none opacity-60 mt-1 ${isCurrent ? 'text-white' : 'text-zinc-400'}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                                {subLabelText}
                                            </div>
                                        )}
                                    </div>

                                    {/* Middle Content Row — fills space */}
                                    <div className="flex-1 flex flex-col items-center justify-center">
                                        <div className={`font-bold whitespace-nowrap leading-none tracking-tight [font-variant-numeric:tabular-nums] ${hasSubCard ? timeSub : timeNoSub} ${isCurrent ? 'text-white' : isJumuah ? 'text-amber-400' : 'text-white'}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                            {xh ? ne24hFn(xh) : '—'}
                                        </div>
                                    </div>

                                    {/* Bottom Content Row — pinned at bottom */}
                                    {hasSubCard && (
                                        <div className="flex-none flex flex-col items-center w-full px-2 pb-1">
                                            <div className={`py-3 px-8 rounded-[2rem] flex flex-col items-center border-2 transition-all duration-500 w-full ${isCurrent ? 'bg-black/30 border-white/30 shadow-inner' : 'bg-white/5 border-white/20'}`}>
                                                <span className={`text-[13px] font-bold uppercase tracking-[0.2em] leading-none mb-2 ${isCurrent ? 'text-emerald-200' : 'text-zinc-400'}`}>
                                                    {hasLindja ? "Lindja e Diellit" : "Namazi i Natës"}
                                                </span>
                                                <span className={`text-4xl font-bold leading-none ${isCurrent ? 'text-white' : 'text-emerald-400'}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                                    {hasLindja ? ne24hFn(vaktiSot.Lindja) : ne24hFn(settings.ramazan.namazNate.koha || '00:30')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default PrayerGrid;
