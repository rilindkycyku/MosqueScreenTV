import { useMemo } from 'react';

export default function Clock({ currentTime, hijriDate }) {
    const timeFormatter = useMemo(() => new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }), []);

    const dateInfo = useMemo(() => {
        const days = ['E Diele', 'E Hëne', 'E Marte', 'E Mërkure', 'E Enjte', 'E Premte', 'E Shtune'];
        const months = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
        return `${days[currentTime.getDay()]}, ${currentTime.getDate()} ${months[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
    }, [currentTime]);

    return (
        <div className="text-right flex flex-col items-end">
            <div className="flex items-baseline text-7xl font-black tabular-nums tracking-tight leading-none mb-1 text-white">
                <span>{timeFormatter.format(currentTime)}</span>
                <span className="text-4xl text-zinc-500 font-bold w-[70px] text-center inline-block border-l-2 border-zinc-800/50 ml-4 font-mono">
                    {currentTime.getSeconds().toString().padStart(2, '0')}
                </span>
            </div>
            <div className="text-emerald-400 text-2xl font-medium tracking-wide uppercase">
                {dateInfo}
            </div>
            <div className="text-emerald-600 text-xl font-medium tracking-wider uppercase mt-1">{hijriDate}</div>
        </div>
    );
}
