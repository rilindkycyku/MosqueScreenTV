import { memo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const ActivityBox = memo(function ActivityBox({ displayMode, settings, currentHadith, vaktiSot, infoTani }) {
    const { isSilenceMode } = infoTani || {};
    const customMsg = settings?.customMsg || "";

    // 1. SILENCE MODE (Highest Priority)
    if (isSilenceMode) {
        return (
            <div className="bg-zinc-900 border-4 border-amber-500/50 rounded-[3.5rem] p-8 relative overflow-hidden flex flex-col items-center justify-center animate-pulse">
                <div className="text-amber-500 mb-6">
                    <svg className="w-48 h-48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-5xl font-black text-white text-center leading-tight uppercase">JU LUTEMI FIKNI OSE NDALJANI ZËRIN TELEFONAVE!</h2>
                <p className="text-amber-500 uppercase tracking-[0.3em] font-black text-4xl mt-6">Koha e Namazit</p>
            </div>
        );
    }

    if (displayMode === 'qr') {
        const qrUrl = settings.qrUrl || "https://xhamiaedushkajes.org";
        return (
            <div className="bg-zinc-900 border-2 border-white/5 rounded-[3.5rem] p-10 relative overflow-hidden flex flex-col items-center justify-center shadow-premium">
                <div className="flex flex-row items-center gap-12 w-full h-full justify-center px-6 animate-slide-up">
                    <div className="p-6 bg-white rounded-[2.5rem] shrink-0 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <QRCodeCanvas
                            value={qrUrl}
                            size={320}
                            level="H"
                            fgColor="#000000"
                            includeMargin={false}
                        />
                    </div>
                    <div className="flex flex-col items-start gap-4 text-left">
                        <div className="flex flex-col gap-1">
                            <span className="text-emerald-400 uppercase tracking-[0.5em] text-xl font-black">Skano Faqen</span>
                            <span className="text-zinc-500 uppercase tracking-[0.2em] text-sm font-bold opacity-60">Për më shumë informata</span>
                        </div>
                        <div className="h-1.5 w-16 bg-emerald-500/30 rounded-full my-2" />
                        <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl">
                            <p className="text-zinc-300 text-3xl font-mono font-bold tracking-tight">
                                {qrUrl.replace('https://', '').replace('www.', '')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900 border-2 border-white/5 rounded-[3.5rem] p-8 relative overflow-hidden flex flex-col items-center justify-center transition-all duration-700">
            <div className="w-full mb-2 opacity-40">
                <p className="text-zinc-400 uppercase tracking-[0.3em] text-lg font-black text-center">
                    {displayMode === 'message' ? "Shënim / Festë" :
                        displayMode === 'custom' ? "Njoftim i Rëndësishëm" : "Hadith / Ajet"}
                </p>
            </div>
            <div className="flex-1 flex flex-col justify-center text-center animate-slide-up w-full px-2">
                {displayMode === 'custom' ? (
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <h3 className="text-4xl lg:text-5xl font-black text-emerald-400 leading-tight mb-4 uppercase">Njoftim</h3>
                        <p className="text-2xl lg:text-4xl text-white font-bold leading-relaxed px-4">{customMsg}</p>
                    </div>
                ) : displayMode === 'message' ? (
                    <div className="flex-1 flex flex-col justify-center items-center">
                        {vaktiSot.Festat && (
                            <div className="mb-4">
                                <div className="text-emerald-400 font-bold uppercase tracking-widest text-base mb-1 opacity-80">Festa</div>
                                <h3 className="text-3xl lg:text-5xl font-black text-white leading-tight uppercase">{vaktiSot.Festat}</h3>
                            </div>
                        )}
                        {vaktiSot.Shenime && (
                            <div>
                                {vaktiSot.Festat && <div className="w-12 h-px bg-white/10 mx-auto my-4" />}
                                <p className="text-2xl lg:text-4xl text-zinc-300 italic leading-relaxed px-4 opacity-90">"{vaktiSot.Shenime}"</p>
                            </div>
                        )}
                    </div>
                ) : currentHadith ? (
                    <div className="flex-1 flex flex-col justify-center items-center overflow-hidden">
                        {currentHadith.entryText && <p className="text-zinc-500 text-xl mb-2 italic font-medium opacity-60">{currentHadith.entryText}</p>}
                        <h3 className="text-2xl lg:text-4xl leading-tight italic font-bold text-white mb-6 line-clamp-6 px-4">"{currentHadith.textContent}"</h3>
                        <div className="w-12 h-1 bg-emerald-500 rounded-full mb-4 shrink-0" />
                        <p className="text-emerald-400 font-black text-2xl lg:text-3xl">{currentHadith.reference}</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <h3 className="text-4xl font-bold text-white uppercase tracking-tighter opacity-70">
                            {settings.name}
                        </h3>
                    </div>
                )}
            </div>
        </div>
    );
});

export default ActivityBox;
