import { QRCodeCanvas } from 'qrcode.react';

export default function ActivityBox({ displayMode, settings, currentHadith, vaktiSot }) {
    if (displayMode === 'qr') {
        return (
            <div className="bg-zinc-900/80 backdrop-blur-sm border-2 border-white/5 rounded-[3.5rem] p-12 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
                <div className="flex flex-row items-center gap-16 w-full h-full justify-center px-10">
                    <div className="p-5 bg-white rounded-[2rem] shrink-0 shadow-2xl">
                        <QRCodeCanvas value={settings.qrUrl} size={380} level="H" />
                    </div>
                    <div className="flex flex-col items-start gap-6 text-left">
                        <div className="flex flex-col">
                            <p className="text-emerald-400 uppercase tracking-[0.5em] text-3xl font-black leading-tight">SKANO FAQEN</p>
                            <p className="text-zinc-500 uppercase tracking-[0.2em] text-sm font-bold mt-2">Për më shumë informata</p>
                        </div>
                        <div className="h-px w-32 bg-zinc-800" />
                        <p className="text-zinc-400 text-4xl font-black tracking-tighter opacity-80 break-all max-w-[350px] leading-tight italic">
                            {settings.qrUrl.replace('https://', '').replace('www.', '')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900/80 backdrop-blur-sm border-2 border-white/5 rounded-[3.5rem] p-12 relative overflow-hidden flex flex-col items-center justify-center transition-all duration-700 shadow-2xl">
            <div className="w-full mb-6 opacity-50">
                <p className="text-zinc-500 uppercase tracking-widest text-sm font-black text-center">
                    {displayMode === 'message' ? "Shënim / Festë" :
                        displayMode === 'custom' ? "Njoftim i Rëndësishëm" : "Hadith / Ajet"}
                </p>
            </div>
            <div className="flex-1 flex flex-col justify-center text-center">
                {displayMode === 'custom' ? (
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <h3 className="text-5xl lg:text-6xl font-black text-emerald-400 leading-tight mb-8">Njoftim</h3>
                        <p className="text-3xl lg:text-5xl text-white font-bold leading-relaxed px-4">{settings.customMsg}</p>
                    </div>
                ) : displayMode === 'message' ? (
                    <div className="flex-1 flex flex-col justify-center items-center">
                        {vaktiSot.Festat && (
                            <div className="mb-6">
                                <div className="text-emerald-400 font-bold uppercase tracking-widest text-lg mb-2 opacity-80">Festa</div>
                                <h3 className="text-4xl lg:text-6xl font-black text-white leading-tight">{vaktiSot.Festat}</h3>
                            </div>
                        )}
                        {vaktiSot.Shenime && (
                            <div>
                                {vaktiSot.Festat && <div className="w-16 h-px bg-white/10 mx-auto my-6" />}
                                <p className="text-3xl lg:text-5xl text-zinc-300 italic leading-relaxed px-4">"{vaktiSot.Shenime}"</p>
                            </div>
                        )}
                    </div>
                ) : currentHadith ? (
                    <div className="flex-1 flex flex-col justify-center items-center overflow-hidden">
                        {currentHadith.entryText && <p className="text-zinc-400 text-2xl mb-4 italic">{currentHadith.entryText}</p>}
                        <h3 className="text-3xl lg:text-4xl leading-relaxed italic font-bold text-white mb-8 line-clamp-5 px-8">"{currentHadith.textContent}"</h3>
                        <div className="w-16 h-1.5 bg-emerald-500 rounded-full mb-4 shrink-0" />
                        <p className="text-emerald-400 font-black text-3xl">{currentHadith.reference}</p>
                    </div>
                ) : <h3 className="text-4xl font-bold text-white">{settings.name}</h3>}
            </div>
        </div>
    );
}
