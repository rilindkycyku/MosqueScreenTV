import { useState, useEffect, useMemo, memo } from 'react';

const Clock = memo(function Clock({ mode }) {
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
            const getParts = (date) => {
                const options = { day: 'numeric', month: 'numeric', year: 'numeric' };
                try {
                    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { ...options }).formatToParts(date);
                } catch (e) {
                    return new Intl.DateTimeFormat('en-u-ca-islamic', { ...options }).formatToParts(date);
                }
            };

            const parts = getParts(currentTime);
            const rawDay = parseInt(parts.find(p => p.type === 'day')?.value);
            const rawMonth = parseInt(parts.find(p => p.type === 'month')?.value);
            const year = parts.find(p => p.type === 'year')?.value?.replace(/[^0-9]/g, '');

            // Regional adjustment: Apply -1 day offset only inside Ramadan (month 9) and not on day 1
            const displayDay = (rawMonth === 9 && rawDay > 1) ? rawDay - 1 : rawDay;

            const monthNames = ["Muharrem", "Safer", "Rebiul Evel", "Rebiul Ahir", "Xhumadel Ula", "Xhumadel Ahire", "Rexhep", "Shaban", "Ramazan", "Sheval", "Dhul Kade", "Dhul Hixhe"];
            return `${displayDay} ${monthNames[rawMonth - 1]} ${year}`;
        } catch (e) { return ""; }
    }, [currentTime.getDate(), currentTime.getMonth(), currentTime.getFullYear()]);

    if (mode === 'home_left') {
        return (
            <div className="flex flex-col items-start gap-1">
                <span className="text-emerald-500 text-3xl font-black uppercase tracking-tight">{dateInfo}</span>
                <span className="text-zinc-500 text-2xl font-bold uppercase tracking-tight opacity-70">{hijriDate}</span>
            </div>
        );
    }

    if (mode === 'home_right') {
        return (
            <div className="text-[7rem] font-black tabular-nums tracking-tighter leading-none text-white mr-4">
                {timeFormatter.format(currentTime)}
            </div>
        );
    }

    return (
        <div className="text-right flex flex-col items-end">
            <div className="flex items-baseline text-7xl font-black tabular-nums tracking-tight leading-none mb-1 text-white">
                <span>{timeFormatter.format(currentTime)}</span>
            </div>
            <div className="text-emerald-400 text-2xl font-black tracking-wide uppercase">
                {dateInfo}
            </div>
            <div className="text-emerald-600 text-xl font-bold tracking-wider uppercase mt-1 opacity-80">{hijriDate}</div>
        </div>
    );
});

export default Clock;
