// Prohibited-prayer-window layout: same top-left takeover as SilenceNotice,
// shown instead of it whenever no prayer is imminent (see isProhibitedFocus
// in App.jsx) — sunrise, zenith, and sunset are windows nafl/qada prayer is
// forbidden in, not moments the mosque calls for silence.
export default function ProhibitedNotice({ label }) {
    return (
        <div className="bg-zinc-900 border-4 border-rose-500/50 rounded-[3.5rem] p-4 relative overflow-hidden flex flex-col items-center justify-center text-center h-full shadow-[0_0_60px_rgba(244,63,94,0.15)]">
            <div className="text-rose-500 mb-0">
                <svg className="w-40 h-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
            </div>
            <h2 className="text-[4.5rem] font-black text-white leading-[1.05] uppercase tracking-tight max-w-[98%] mx-auto">
                KOHA E NDALUAR PËR NAMAZ
            </h2>
            <div className="mt-6 flex flex-col items-center">
                <div className="h-1 w-20 bg-rose-500/30 rounded-full mb-4" />
                <p className="text-rose-500 uppercase tracking-[0.4em] font-black text-3xl">{label}</p>
            </div>
        </div>
    );
}
