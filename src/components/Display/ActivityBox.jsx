import { memo, lazy, Suspense, useState, useEffect } from 'react';

// Lazy load the heavy QR library - only loaded when needed in the display cycle
const QRCodeCanvas = lazy(() => import('qrcode.react').then(mod => ({ default: mod.QRCodeCanvas })));

const ActivityBox = memo(function ActivityBox({ displayMode, settings, currentHadith, vaktiSot, infoTani }) {
    const { isSilenceMode } = infoTani || {};
    const showSilence = settings?.showSilenceWarning !== false;
    const customMsg = settings?.customMsg || "";

    // REVOLUTIONARY DYNAMIC ROTATION: A fresh image every time the view cycles
    const [currentBgUrl, setCurrentBgUrl] = useState(null);

    useEffect(() => {
        // Scans ALL images in the scenery folder
        const allAssets = import.meta.glob('../../assets/scenery/*.{webp,jpg,jpeg,png,jpeg}', { eager: true, import: 'default' });
        const bgList = Object.values(allAssets);
        if (bgList.length === 0) return;

        // Content-Synchronized Picker: Only changes the background when the actual Hadith or Message text changes.
        // This ensures the image stays steady for the full 45-minute refresh period as requested.
        const seedValue = (currentHadith?.textContent || "") + (vaktiSot?.Shenime || "") + (vaktiSot?.Festat || "");
        
        // Simple hash function for consistent image selection
        let hash = 0;
        for (let i = 0; i < seedValue.length; i++) {
            hash = ((hash << 5) - hash) + seedValue.charCodeAt(i);
            hash |= 0;
        }
        
        const index = Math.abs(hash) % bgList.length;
        setCurrentBgUrl(bgList[index]);
    }, [currentHadith?.textContent, vaktiSot?.Shenime, vaktiSot?.Festat]);

    // 1. SILENCE MODE (Highest Priority)
    if (isSilenceMode && showSilence) {
        return (
            <div className="bg-zinc-900 border-4 border-amber-500/50 rounded-[3.5rem] p-4 relative overflow-hidden flex flex-col items-center justify-center animate-pulse text-center h-full shadow-[0_0_60px_rgba(245,158,11,0.15)]">
                <div className="text-amber-500 mb-0">
                    <svg className="w-48 h-48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-4xl lg:text-[5rem] font-black text-white leading-[1.05] uppercase tracking-tight max-w-[98%] mx-auto">
                    FIKNI OSE NDALJANI ZËRIN TELEFONAVE!
                </h2>
                <div className="mt-6 flex flex-col items-center">
                    <div className="h-1 w-20 bg-amber-500/30 rounded-full mb-4" />
                    <p className="text-amber-500 uppercase tracking-[0.4em] font-black text-xl lg:text-3xl">KOHA E NAMAZIT</p>
                </div>
            </div>
        );
    }

    if (displayMode === 'qr') {
        const qrUrl = settings.qrUrl || "https://xhamiaedushkajes.org";
        return (
            <div className="activity-box bg-zinc-900 border-2 border-white/5 rounded-[3.5rem] p-4 relative overflow-hidden flex flex-col items-center justify-center shadow-premium h-full">
                <div className="flex flex-row items-center gap-12 w-full h-full justify-center px-6 animate-slide-up">
                    <div className="p-6 bg-white rounded-[2.5rem] shrink-0 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <Suspense fallback={<div className="w-[320px] h-[320px] bg-zinc-100 rounded-2xl animate-pulse" />}>
                            <QRCodeCanvas
                                value={qrUrl}
                                size={320}
                                level="H"
                                fgColor="#000000"
                                includeMargin={false}
                            />
                        </Suspense>
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
        <div className={`activity-box bg-zinc-900 border-2 border-white/5 rounded-[3.5rem] p-2 relative overflow-hidden flex flex-col transition-all duration-700 h-full`}>
            {/* Dynamic Scenery Background with local high-res library */}
            {(displayMode === 'hadith' || displayMode === 'message' || displayMode === 'custom') && (
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="w-full h-full relative" style={{ contain: 'strict', willChange: 'transform' }}>
                        {currentBgUrl && (
                            <img
                                key={currentBgUrl} // Force re-render for smooth transition
                                src={currentBgUrl}
                                alt=""
                                decoding="async"
                                className="w-full h-full object-cover opacity-70 blur-[0.2px] scale-102 transition-opacity duration-1000 ease-in-out"
                                style={{ imageRendering: 'optimizeSpeed' }}
                            />
                        )}
                        {/* Multi-Site Layered Darkness Overlay */}
                        <div 
                            className="absolute inset-0 z-10 opacity-80" 
                            style={{ 
                                backgroundImage: "url('/images/background-opacity.png')",
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                contain: 'strict'
                            }} 
                        />
                        {/* Grounding gradient for text contrast */}
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20" />
                    </div>
                </div>
            )}

            <div className="w-full h-full flex flex-col justify-between px-1 pt-1 pb-1 relative z-10 animate-slide-up" style={{ contain: 'content' }}>
                {/* 1. Header Label */}
                <div className="w-full flex flex-col items-center pt-2">
                    <div className="flex items-center gap-4 mb-2 opacity-90">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <p className="text-white uppercase tracking-[0.4em] text-2xl font-black text-center drop-shadow-md">
                            {displayMode === 'message' ? "Shënim / Festë" :
                                displayMode === 'custom' ? "Njoftim i Rëndësishëm" : "Hadith / Ajet"}
                        </p>
                    </div>
                </div>

                {/* 2. Main Content */}
                <div className="flex-1 flex flex-col justify-center text-center w-full px-2">
                    {displayMode === 'custom' ? (
                        <div className="flex flex-col items-center">
                            <h3 className="text-4xl lg:text-5xl font-black text-emerald-400 leading-tight mb-2 uppercase drop-shadow-lg">Njoftim</h3>
                            <p className="text-2xl lg:text-4xl text-white font-bold leading-relaxed drop-shadow-md">{customMsg}</p>
                        </div>
                    ) : displayMode === 'message' ? (
                        <div className="flex flex-col items-center">
                            {vaktiSot?.Festat && (
                                <div className="mb-2">
                                    <div className="text-emerald-400 font-bold uppercase tracking-widest text-base mb-1 opacity-90 drop-shadow-sm">Festa</div>
                                    <h3 className="text-3xl lg:text-5xl font-black text-white leading-tight uppercase drop-shadow-lg">{vaktiSot.Festat}</h3>
                                </div>
                            )}
                            {vaktiSot?.Shenime && (
                                <div>
                                    {vaktiSot.Festat && <div className="w-12 h-px bg-white/10 mx-auto my-4" />}
                                    <p className="text-2xl lg:text-4xl text-zinc-100 italic leading-relaxed opacity-95 drop-shadow-md">"{vaktiSot.Shenime}"</p>
                                </div>
                            )}
                        </div>
                    ) : currentHadith ? (
                        <div className="overflow-hidden flex flex-col items-center justify-center w-full px-2">
                            {(() => {
                                const entryLen = currentHadith.entryText?.length || 0;
                                const contentLen = currentHadith.textContent?.length || 0;
                                const referenceLen = currentHadith.reference?.length || 0;
                                const tot = entryLen + contentLen + referenceLen;

                                const entryClass = tot > 500 ? 'text-lg' : tot > 350 ? 'text-xl' : 'text-2xl';
                                const contentClass =
                                    tot > 650 ? 'text-xl lg:text-[1.4rem]' :
                                        tot > 500 ? 'text-2xl lg:text-[1.7rem]' :
                                            tot > 400 ? 'text-3xl lg:text-[2.1rem]' :
                                                tot > 300 ? 'text-4xl lg:text-[2.6rem]' :
                                                    tot > 200 ? 'text-5xl lg:text-[3.1rem]' :
                                                        tot > 150 ? 'text-5xl lg:text-[3.6rem]' :
                                                            'text-6xl lg:text-[4.2rem]';

                                return (
                                    <>
                                        {currentHadith.entryText && (
                                            <p className={`text-zinc-200 mb-2 italic font-semibold text-center drop-shadow-sm ${entryClass}`}>
                                                {currentHadith.entryText}
                                            </p>
                                        )}
                                        <h3 className={`leading-[1.1] italic font-bold text-white mb-4 text-center drop-shadow-xl ${contentClass}`}>
                                            "{currentHadith.textContent}"
                                        </h3>
                                    </>
                                );
                            })()}
                            <div className="mt-2 text-center">
                                <div className="w-12 h-0.5 bg-emerald-500 rounded-full mb-2 mx-auto opacity-40" />
                                <p className="text-emerald-400 font-bold text-xl lg:text-[1.6rem] leading-none">{currentHadith.reference}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <h3 className="text-4xl font-bold text-white uppercase tracking-tighter opacity-70">
                                {settings.name}
                            </h3>
                        </div>
                    )}
                </div>

                {/* 3. Empty Footer minimized for space */}
                <div className="h-1 w-full" />
            </div>
        </div>
    );
});

export default ActivityBox;
