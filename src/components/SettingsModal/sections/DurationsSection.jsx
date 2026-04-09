import { HiClock } from "react-icons/hi";
import { SectionHeader, NumberInput } from "./shared";

export default function DurationsSection({ settings, setSettings, triggerConfirm, onReset }) {
    const fields = [
        { id: 'hadithRefresh', label: 'Rifreskimi i Hadithit / Ajetit', desc: 'Koha për përditësimin automatik të Hadithit / Ajetit.' },
        { id: 'hadith', label: 'Hadithi / Ajeti', desc: 'Sa kohë të qëndrojë Hadithi / Ajeti i shfaqur.' },
        { id: 'qr', label: 'QR Kodi', desc: 'Koha e shfaqjes së QR Code për skanim.', mosqueOnly: true },
        { id: 'notification', label: 'Njoftimi Special', desc: 'Sa kohë të shfaqet mesazhi juaj i lënë.', mosqueOnly: true },
        { id: 'announcement', label: 'Festat / Shënimet', desc: 'Koha për shfaqjen e festave dhe shënimeve nga kalendari.' }
    ].filter(f => !f.mosqueOnly || settings.appMode === 'mosque');

    return (
        <div className="space-y-10">
            <SectionHeader
                icon={HiClock}
                title="Timerat"
                description="Menaxhimi i kohës për çdo element që qarkullon në ciklin e shfaqjes."
                onReset={() => triggerConfirm(
                    "Rikthe Timerat",
                    "A dëshironi të ktheni të gjitha kohëzgjatjet në vlerat fillestare?",
                    onReset
                )}
            />

            <div className="grid grid-cols-3 gap-8">
                {fields.map(f => (
                    <NumberInput
                        key={f.id}
                        label={f.label}
                        description={f.desc}
                        value={settings.durations[f.id] > 1000 ? Math.round(settings.durations[f.id] / 60000) : (settings.durations[f.id] || 0)}
                        onChange={(val) => {
                            let adjustedVal = Math.max(0, val);
                            if (f.id === 'hadithRefresh') {
                                const minV = Math.max(1, (settings.durations.hadith > 1000 ? Math.round(settings.durations.hadith / 60000) : (settings.durations.hadith || 0)));
                                adjustedVal = Math.max(minV, adjustedVal);
                            }
                            setSettings(p => ({
                                ...p,
                                durations: { ...p.durations, [f.id]: adjustedVal }
                            }))
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
