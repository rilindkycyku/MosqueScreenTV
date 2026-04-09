import { memo, useMemo } from 'react';

const PrayerGrid = memo(function PrayerGrid({ listaNamazeve, vaktiSot, infoTani, xhematiFn, ne24hFn, isRamazan, settings }) {
    const namazNateActive = isRamazan && settings?.ramazan?.namazNate?.active && settings?.appMode !== 'home';
    const isFriday = useMemo(() => new Date().getDay() === 5, [vaktiSot.Date]); // Only re-calc when date changes

    const colCount = listaNamazeve.length;
    const is6Col = colCount >= 6;
    const is7Col = colCount >= 7;

    // Optimized font sizes for 1920x1080 display with proximity gaps
    // Optimized font sizes for 1920x1080 display - Labels kept large, numbers refined
    const labelSize = is7Col ? 'text-3xl' : is6Col ? 'text-4xl' : 'text-5xl';
    const subLabelSize = is7Col ? 'text-lg' : is6Col ? 'text-xl' : 'text-2xl';
    const timeNoSub = is7Col ? 'text-[7.2rem]' : is6Col ? 'text-[8.5rem]' : 'text-[10rem]';
    const timeSubSingle = is7Col ? 'text-[6rem]' : is6Col ? 'text-[7.5rem]' : 'text-[8.5rem]';
    const timeSubDual = is7Col ? 'text-[5.5rem]' : is6Col ? 'text-[6.8rem]' : 'text-[7.5rem]';
    const cardPx = is7Col ? 'px-4' : is6Col ? 'px-6' : 'px-10';
    const trackingVal = is7Col ? 'tracking-normal' : is6Col ? 'tracking-[0.1em]' : 'tracking-[0.1em]';

    return (
        <div className="prayer-grid-box flex-1 min-h-0 relative z-10" style={{ contain: 'layout style' }}>
            <div className="bg-zinc-900 rounded-[3.5rem] p-4 border border-white/5 shadow-premium h-full flex flex-col justify-center overflow-hidden">
                <div className="grid gap-5 h-full" style={{ gridTemplateColumns: `repeat(${listaNamazeve.length}, 1fr)` }}>
                    {listaNamazeve.map(({ id, label }, index) => {
                        const xh = xhematiFn(id);
                        const isCurrent = infoTani?.tani?.id === id;
                        const isNext = infoTani?.ardhshëm?.id === id;
                        const isJumuah = isFriday && (id === 'Dreka' || id === 'Xhuma1' || id === 'Xhuma2') && settings?.appMode !== 'home';

                        // Calculate status in the daily cycle
                        const currentIndex = listaNamazeve.findIndex(p => p.id === infoTani?.tani?.id);
                        const isPast = currentIndex === -1 ? false : index < currentIndex;

                        const hasLindja = id === 'Sabahu' && !isRamazan && vaktiSot.Lindja;
                        const hasNamazNate = namazNateActive && id === 'Jacia';

                        const subCardsArray = [];
                        if (hasLindja && vaktiSot.Lindja) {
                            subCardsArray.push({ label: "L. Diellit", time: vaktiSot.Lindja });
                        }
                        if (hasNamazNate && settings?.ramazan?.namazNate?.koha) {
                            subCardsArray.push({ label: "N. Natës", time: settings.ramazan.namazNate.koha });
                        }

                        if (settings?.iqamah?.active && settings?.appMode === 'mosque') {
                            const isDailyPrayer = ['sabahu', 'dreka', 'ikindia', 'akshami', 'jacia'].includes(id.toLowerCase());
                            if (isDailyPrayer) {
                                // Find Adhan time for the base calculation
                                let baseTime = null;
                                if (id === 'Dreka' && settings.manualDreka && settings.manualDreka !== "00:00") {
                                    baseTime = settings.manualDreka;
                                } else if (id === 'Dreka' && vaktiSot.Dreka) {
                                    // Handle automatic 11:55 / 12:55 fallback that xhemati does for Dreka, or just use vaktiSot.Dreka
                                    // Usually Ezan is same as Xhemat for Dreka unless overridden.
                                    const [h] = vaktiSot.Dreka.split(":").map(Number);
                                    baseTime = h < 12 ? "11:55" : "12:55";
                                } else if (vaktiSot[id]) {
                                    baseTime = vaktiSot[id];
                                }

                                const offset = Number(settings.iqamah[id.toLowerCase()]);
                                if (baseTime && !isNaN(offset) && offset !== 0) {
                                    const [h, m] = baseTime.split(":").map(Number);
                                    const total = h * 60 + m + offset;
                                    const iqTime = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(((total % 60) + 60) % 60).padStart(2, '0')}`;
                                    subCardsArray.push({ label: "Ikameti", time: iqTime });
                                }
                            }
                        }

                        const hasSubCard = subCardsArray.length > 0;

                        const toTitleCase = s => {
                            if (!s) return s;
                            // Force uppercase for Xhuma labels
                            if (s.toLowerCase().includes('xhuma')) return s.toUpperCase();
                            return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
                        };
                        const labelParts = label.split(' (');
                        const mainLabel = toTitleCase(labelParts[0]);
                        const subLabelText = labelParts[1] ? toTitleCase(labelParts[1].replace(')', '')) : null;

                        return (
                            <div
                                key={id}
                                className={`flex flex-col rounded-[3rem] p-0 border-2 transition-all duration-700 relative overflow-hidden h-full
                                    ${isCurrent
                                        ? 'bg-[#34D399] shadow-[0_0_80px_rgba(52,211,153,0.25)] border-white/50 z-20 scale-[1.02]'
                                        : isNext
                                            ? 'bg-zinc-800/80 border-[#34D399]/50'
                                            : isPast
                                                ? 'bg-black/10 border-white/5 opacity-40 blur-[0.5px]'
                                                : isJumuah
                                                    ? 'bg-amber-950/20 shadow-[0_0_45px_rgba(245,158,11,0.15)] border-amber-500/40'
                                                    : 'bg-black/40 border-white/5'}`}
                            >
                                <div className={`relative z-10 w-full h-full flex flex-col justify-between ${cardPx} pt-8 pb-5`}>
                                    {/* Top Content Row — Luxurious vertical flow */}
                                    <div className="flex-none flex flex-col items-center">
                                        <div className={`${labelSize} font-extrabold ${trackingVal} text-center leading-none ${isCurrent ? 'text-emerald-950' : isJumuah ? 'text-amber-400' : 'text-zinc-200'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                                            {mainLabel}
                                        </div>
                                        {subLabelText && (
                                            <div className={`${subLabelSize} font-bold tracking-tight leading-none opacity-80 mt-1.5 ${isCurrent ? 'text-emerald-900/70' : 'text-amber-500'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                                                {subLabelText}
                                            </div>
                                        )}
                                    </div>

                                    {/* Middle Content Row — Automatically centers in the available space */}
                                    <div className="flex-1 flex flex-col items-center justify-center pt-4">
                                        <div className={`font-bold whitespace-nowrap leading-none tracking-tight [font-variant-numeric:tabular-nums] origin-center ${subLabelText ? 'scale-y-[1.15]' : 'scale-y-[1.3]'} ${!hasSubCard ? timeNoSub : (subCardsArray.length > 1 ? timeSubDual : timeSubSingle)} ${isCurrent ? 'text-zinc-950' : isJumuah ? 'text-amber-400' : 'text-white'}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                            {xh ? ne24hFn(xh) : '—'}
                                        </div>
                                    </div>

                                    {/* Bottom Content Row — pinned at bottom */}
                                    {hasSubCard && (
                                        <div className="flex-none flex flex-col items-center w-full px-2 pb-1 gap-1.5">
                                            {subCardsArray.map((sub, i) => {
                                                const isSingle = subCardsArray.length === 1;
                                                const subTextSize = is7Col ? 'text-xs' : is6Col ? 'text-sm' : sub.label.length > 10 ? 'text-sm' : 'text-base';
                                                
                                                return (
                                                    <div key={i} className={`pt-1.5 pb-1.5 px-6 rounded-[2rem] flex ${isSingle ? 'flex-col justify-center' : 'flex-row justify-between'} items-center border-2 transition-all duration-500 w-full ${isCurrent ? 'bg-emerald-950/10 border-emerald-950/20 shadow-inner' : 'bg-white/5 border-white/20'}`}>
                                                        <span className={`${subTextSize} font-bold tracking-[0.1em] leading-none ${isSingle ? 'mb-1' : ''} whitespace-nowrap ${isCurrent ? 'text-emerald-950/80' : 'text-zinc-400'}`}>
                                                            {sub.label}
                                                        </span>
                                                        <span className={`${isSingle ? (is7Col ? 'text-4xl' : is6Col ? 'text-4xl' : 'text-5xl') : (is7Col ? 'text-2xl' : is6Col ? 'text-3xl' : 'text-[2.2rem]')} font-bold leading-none ${isCurrent ? 'text-zinc-950' : 'text-white'} ${!isSingle ? 'mt-0.5' : ''}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                                                            {ne24hFn(sub.time)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
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
