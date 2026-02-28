import { memo } from 'react';

const PrayerGrid = memo(function PrayerGrid({ listaNamazeve, vaktiSot, infoTani, xhematiFn, ne24hFn, isRamazan }) {
    return (
        <div className="flex-1 min-h-0 relative z-10">
            <div className="bg-zinc-900 rounded-[3.5rem] p-6 border border-white/5 shadow-premium h-full flex flex-col justify-center">
                <div className={`grid gap-3 h-full ${listaNamazeve.length === 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
                    {listaNamazeve.map(({ id, label }) => {
                        const kohe = vaktiSot[id];
                        const xh = xhematiFn(id);
                        const isCurrent = infoTani?.tani?.id === id;
                        const isNext = infoTani?.ardhshëm?.id === id;
                        const isFriday = new Date().getDay() === 5;
                        const isJumuah = isFriday && id === 'Dreka';

                        return (
                            <div key={id} className={`flex flex-col rounded-[3rem] px-2 py-6 items-center justify-between border-2 transition-transform duration-500 relative overflow-hidden ${isCurrent ? 'bg-emerald-600 border-white/60 z-10 shadow-lg scale-[1.03]' : isNext ? 'bg-zinc-800/80 border-emerald-500/50 scale-[1.01]' : isJumuah ? 'bg-amber-900/20 border-amber-500/30' : 'bg-black/40 border-white/5 opacity-80'}`}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`text-3xl font-black uppercase tracking-[0.1em] text-center leading-tight ${isCurrent ? 'text-white' : isJumuah ? 'text-amber-400' : 'text-zinc-500'}`}>
                                        {label.split(' (')[0]}
                                    </div>
                                    {label.includes('(') && <div className={`text-base font-bold uppercase tracking-widest opacity-60 ${isCurrent ? 'text-white' : 'text-zinc-500'}`}>{label.split('(')[1].replace(')', '')}</div>}
                                </div>
                                <div className="flex flex-col items-center justify-center flex-1 py-1">
                                    <div className={`text-5xl lg:text-[5rem] font-black font-mono tracking-tighter whitespace-nowrap leading-none ${isCurrent ? 'text-white' : isJumuah ? 'text-amber-400' : 'text-white'}`}>
                                        {xh ? ne24hFn(xh) : "—"}
                                    </div>
                                </div>
                                {id === 'Sabahu' && !isRamazan && vaktiSot.Lindja && (
                                    <div className="w-full px-2 mt-2">
                                        <div className={`py-4 rounded-3xl flex flex-col items-center border transition-all duration-500 ${isCurrent ? 'bg-black/30 border-white/20 shadow-inner' : 'bg-white/5 border-white/10'}`}>
                                            <span className={`text-[12px] font-black uppercase tracking-[0.2em] leading-none mb-2 ${isCurrent ? 'text-emerald-200' : 'text-zinc-500'}`}>Lindja e Diellit</span>
                                            <span className={`text-4xl font-black font-mono leading-none ${isCurrent ? 'text-white' : 'text-emerald-400'}`}>{ne24hFn(vaktiSot.Lindja)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default PrayerGrid;
