import { memo } from 'react';

const PrayerGrid = memo(function PrayerGrid({ listaNamazeve, vaktiSot, infoTani, xhematiFn, ne24hFn }) {
    return (
        <div className="flex-1 min-h-0 relative z-10">
            <div className="bg-zinc-900/60 backdrop-blur-sm rounded-[3.5rem] p-6 border border-white/5 shadow-2xl h-full flex flex-col justify-center">
                <div className="grid grid-cols-6 gap-3 h-full">
                    {listaNamazeve.map(({ id, label }) => {
                        const kohe = vaktiSot[id];
                        const xh = !['Imsaku', 'Lindja'].includes(id) ? xhematiFn(id) : null;
                        const isCurrent = infoTani?.tani?.id === id;
                        const isNext = infoTani?.ardhshëm?.id === id;
                        const isJumuah = new Date().getDay() === 5 && id === 'Dreka';

                        return (
                            <div key={id} className={`flex flex-col rounded-[3rem] px-2 py-6 items-center justify-between border-2 transition-[background-color,border-color,transform,box-shadow] duration-500 relative overflow-hidden ${isCurrent ? 'bg-emerald-600 border-white/60 z-10 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : isNext ? 'bg-zinc-800/80 border-emerald-500/50' : isJumuah ? 'bg-amber-900/20 border-amber-500/30' : 'bg-black/40 border-white/5'}`}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`text-2xl font-black uppercase tracking-[0.1em] text-center leading-tight ${isCurrent ? 'text-white' : isJumuah ? 'text-amber-400' : 'text-zinc-500'}`}>
                                        {label.split(' (')[0]}
                                    </div>
                                    {label.includes('(') && <div className={`text-xs font-bold uppercase tracking-widest opacity-60 ${isCurrent ? 'text-white' : 'text-zinc-500'}`}>{label.split('(')[1].replace(')', '')}</div>}
                                </div>
                                <div className="flex flex-col items-center gap-1 py-1">
                                    <div className={`text-8xl font-black font-mono tracking-tighter whitespace-nowrap ${isCurrent ? 'text-white' : isJumuah ? 'text-amber-400' : 'text-white'}`}>{ne24hFn(kohe)}</div>
                                    {isJumuah && !isCurrent && <span className="px-4 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest shadow-lg">Xhumaja</span>}
                                </div>
                                <div className="w-full relative px-2">
                                    <div className={`text-sm font-black uppercase tracking-[0.1em] text-center mb-2 ${isCurrent ? 'text-white/70' : 'text-zinc-500'}`}>Me Xhemat</div>
                                    <div className={`w-full py-4 rounded-[2.5rem] font-mono text-6xl font-black text-center shadow-inner transition-colors whitespace-nowrap ${isCurrent ? 'bg-white text-emerald-950' : isJumuah ? 'bg-amber-500 text-black' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                        {xh ? ne24hFn(xh) : "—"}
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

