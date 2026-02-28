import { useState, useEffect, useMemo, memo } from 'react';

const Clock = memo(function Clock() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeFormatter = useMemo(() => new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }), []);

    const dateInfo = useMemo(() => {
        const days = ['E Diele', 'E Hëne', 'E Marte', 'E Mërkure', 'E Enjte', 'E Premte', 'E Shtune'];
        const months = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
        return `${days[currentTime.getDay()]}, ${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
    }, [currentTime.getDay(), currentTime.getDate(), currentTime.getMonth(), currentTime.getFullYear()]);

    const hijriDate = useMemo(() => {
        try {
            const adjustedDate = new Date(currentTime);
            adjustedDate.setDate(adjustedDate.getDate() - 1);
            let parts;
            try {
                parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(adjustedDate);
            } catch (e) {
                parts = new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(adjustedDate);
            }
            const d = parts.find(p => p.type === 'day')?.value;
            const m = parts.find(p => p.type === 'month')?.value;
            let y = parts.find(p => p.type === 'year')?.value?.replace(/[^0-9]/g, '');
            const monthNames = ["Muharrem", "Safer", "Rebiul Evel", "Rebiul Ahir", "Xhumadel Ula", "Xhumadel Ahire", "Rexhep", "Shaban", "Ramazan", "Sheval", "Dhul Kade", "Dhul Hixhe"];
            return `${d} ${monthNames[parseInt(m) - 1]} ${y}`;
        } catch (e) { return ""; }
    }, [currentTime.getDate(), currentTime.getMonth(), currentTime.getFullYear()]);

    return (
        <div className="text-right flex flex-col items-end" style={{ isolation: 'isolate', contain: 'layout paint' }}>
            <div className="flex items-baseline text-6xl font-black tabular-nums tracking-tight leading-none mb-1 text-white">
                <span>{timeFormatter.format(currentTime)}</span>
                <span className="text-4xl text-zinc-500 font-bold w-[70px] text-center inline-block border-l-2 border-zinc-800/50 ml-4 font-mono">
                    {currentTime.getSeconds().toString().padStart(2, '0')}
                </span>
            </div>
            <div className="text-emerald-400 text-2xl font-black tracking-wide uppercase" style={{ textShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>
                {dateInfo}
            </div>
            <div className="text-emerald-600 text-xl font-bold tracking-wider uppercase mt-1 opacity-80">{hijriDate}</div>
        </div>
    );
});

export default Clock;
