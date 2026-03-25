import { memo } from 'react';

const PrayerGrid = memo(function PrayerGrid({ listaNamazeve, vaktiSot, infoTani, xhematiFn, ne24hFn, isRamazan, settings }) {
    const namazNateActive = isRamazan && settings?.ramazan?.namazNate?.active && settings?.appMode !== 'home';

    return (
        <div className="flex-1 min-h-0 relative z-10">
            <div className="bg-zinc-900 rounded-[3.5rem] p-2 border border-white/5 shadow-premium h-full flex flex-col justify-center">
                <div className={`grid gap-2 h-full ${listaNamazeve.length === 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
                    {listaNamazeve.map(({ id, label }) => {
                        const xh = xhematiFn(id);
                        const isCurrent = infoTani?.tani?.id === id;
                        const isNext = infoTani?.ardhshëm?.id === id;
                        const isFriday = new Date().getDay() === 5;
                        const isJumuah = isFriday && id === 'Dreka' && settings?.appMode !== 'home';

                        const hasLindja = id === 'Sabahu' && !isRamazan && vaktiSot.Lindja;
                        const hasNamazNate = namazNateActive && id === 'Jacia';
                        const hasSubCard = hasLindja || hasNamazNate;

                        // Sub-card content
                        const subCardContent = hasLindja ? (
                            <div className={`py-3 px-8 rounded-[2rem] flex flex-col items-center border-2 transition-all duration-500 ${isCurrent ? 'bg-black/30 border-white/30 shadow-inner' : 'bg-white/5 border-white/20'}`}>
                                <span className={`text-[13px] font-black uppercase tracking-[0.2em] leading-none mb-2 ${isCurrent ? 'text-emerald-200' : 'text-zinc-500'}`}>Lindja e Diellit</span>
                                <span className={`text-4xl font-black font-mono leading-none ${isCurrent ? 'text-white' : 'text-emerald-400'}`}>{ne24hFn(vaktiSot.Lindja)}</span>
                            </div>
                        ) : hasNamazNate ? (() => {
                            const kohaNN = settings.ramazan.namazNate.koha || '00:30';
                            return (
                                <div className={`py-3 px-8 rounded-[2rem] flex flex-col items-center border-2 transition-all duration-500 ${isCurrent ? 'bg-black/30 border-white/30 shadow-inner' : 'bg-white/5 border-white/20'}`}>
                                    <span className={`text-[13px] font-black uppercase tracking-[0.2em] leading-none mb-2 ${isCurrent ? 'text-emerald-200' : 'text-zinc-500'}`}>Namazi i Natës</span>
                                    <span className={`text-4xl font-black font-mono leading-none ${isCurrent ? 'text-white' : 'text-emerald-400'}`}>{ne24hFn(kohaNN)}</span>
                                </div>
                            );
                        })() : null;

                        return (
                            <div
                                key={id}
                                className={`flex flex-col rounded-[3rem] p-0 border-2 transition-[background-color,border-color,transform,box-shadow] duration-500 relative overflow-hidden h-full
                                    ${isCurrent ? 'bg-emerald-600 border-white/60 z-10 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : isNext ? 'bg-zinc-800/80 border-emerald-500/50' : isJumuah ? 'bg-amber-900/20 border-amber-500/30' : 'bg-black/40 border-white/5'}`}
                            >
                                <div className="relative z-10 w-full h-full flex flex-col justify-between px-10 pt-4 pb-8">
                                    {/* Top Content Row */}
                                    <div className="flex-1 flex flex-col items-center justify-start py-2">
                                        <div className={`text-2xl lg:text-3xl font-black uppercase tracking-[0.2em] text-center leading-tight ${isCurrent ? 'text-white' : isJumuah ? 'text-amber-400' : 'text-zinc-500'}`}>
                                            {label.split(' (')[0]}
                                        </div>
                                        <div className={`text-sm font-bold uppercase tracking-[0.2em] opacity-60 ${isCurrent ? 'text-white' : 'text-zinc-500'} ${!label.includes('(') ? 'invisible' : ''}`}>
                                            {label.includes('(') ? label.split('(')[1].replace(')', '') : 'x'}
                                        </div>
                                    </div>

                                    {/* Middle Content Row */}
                                    <div className="flex-none flex flex-col items-center justify-center py-2">
                                        <div className={`text-5xl lg:text-[7rem] font-black font-mono whitespace-nowrap leading-none ${isCurrent ? 'text-white' : isJumuah ? 'text-amber-400' : 'text-white'}`}>
                                            {xh ? ne24hFn(xh) : '—'}
                                        </div>
                                    </div>

                                    {/* Bottom Content Row */}
                                    <div className="flex-1 flex flex-col items-center justify-end w-full px-2">
                                        {hasSubCard && subCardContent}
                                    </div>
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
