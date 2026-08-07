// Friday silence-focus layout: this replaces the NextPrayer countdown in the
// top-left slot for the silence-takeover window, while ActivityBox (top-right)
// keeps showing the Hadith/Ajet and NextPrayer itself moves down to the
// bottom slot (see App.jsx `isFridaySilenceFocus`).
export default function SilenceNotice() {
    return (
        <div className="bg-zinc-900 border-4 border-amber-500/50 rounded-[3.5rem] p-4 relative overflow-hidden flex flex-col items-center justify-center animate-pulse text-center h-full shadow-[0_0_60px_rgba(245,158,11,0.15)]">
            <div className="text-amber-500 mb-0">
                <svg className="w-48 h-48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>
            <h2 className="text-[5rem] font-black text-white leading-[1.05] uppercase tracking-tight max-w-[98%] mx-auto">
                FIKNI OSE NDALJANI ZËRIN TELEFONAVE!
            </h2>
            <div className="mt-6 flex flex-col items-center">
                <div className="h-1 w-20 bg-amber-500/30 rounded-full mb-4" />
                <p className="text-amber-500 uppercase tracking-[0.4em] font-black text-3xl">KOHA E NAMAZIT</p>
            </div>
        </div>
    );
}
