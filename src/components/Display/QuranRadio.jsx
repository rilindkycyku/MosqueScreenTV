import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiPlay,
    HiPause,
    HiSpeakerWave
} from 'react-icons/hi2';

// ─── Permanent Yasser Al-Dosari Radio Stream ─────────────────────────────────
const RADIO_URL = 'https://backup.qurango.net/radio/yasser_aldosari/;';

// ─── Singleton audio ─────────────────────────────────────────────────────────
let globalAudio = null;
if (typeof window !== 'undefined') {
    globalAudio = new Audio();
    globalAudio.src = RADIO_URL;
    globalAudio.volume = 0.5;
    globalAudio.preload = 'none';
    globalAudio.crossOrigin = 'anonymous';
}

export default function QuranRadio() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // ── Audio event wiring ────────────────────────────────────────────────────
    useEffect(() => {
        if (!globalAudio) return;
        const audio = globalAudio;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onPlaying = () => setIsPlaying(true);
        const onError = (e) => {
            console.error("Radio Audio Error:", e);
            setIsPlaying(false);
            try {
                audio.load();
                audio.src = RADIO_URL;
            } catch (err) {}
        };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('playing', onPlaying);
        audio.addEventListener('error', onError);

        // Try to start immediately
        const startRadio = () => {
            if (audio.paused) {
                audio.play()
                    .then(() => {
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 5000);
                        cleanup();
                    })
                    .catch(() => {}); // Wait for interaction
            }
        };

        const cleanup = () => {
            window.removeEventListener('mousedown', startRadio);
            window.removeEventListener('touchstart', startRadio);
            window.removeEventListener('keydown', startRadio);
        };

        startRadio();
        window.addEventListener('mousedown', startRadio);
        window.addEventListener('touchstart', startRadio);
        window.addEventListener('keydown', startRadio);

        return () => {
            audio.pause();
            audio.src = "";
            audio.load();
            cleanup();
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('playing', onPlaying);
            audio.removeEventListener('error', onError);
        };
    }, []);

    return (
        <AnimatePresence>
            {isPlaying && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl"
                >
                    <HiSpeakerWave className="text-emerald-500 animate-pulse" size={20} />
                    <span className="text-lg font-black text-emerald-500 uppercase tracking-widest whitespace-nowrap">Radio LIVE</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
