import { useEffect, useRef } from 'react';

// Dynamically shrinks text until it fully fits inside its container (both axes)
function FitText({ text, className, maxPx = 42, minPx = 16, style }) {
    const containerRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        const el = textRef.current;
        if (!container || !el || !text) return;

        const fit = () => {
            let size = maxPx;
            el.style.fontSize = size + 'px';

            // Shrink until text fits in both dimensions or we hit the minimum
            while (
                (el.scrollHeight > container.clientHeight + 1 || el.scrollWidth > container.clientWidth + 1)
                && size > minPx
            ) {
                size -= 0.5;
                el.style.fontSize = size + 'px';
            }
        };

        fit();

        // Re-fit once webfonts finish loading — measuring before they're ready
        // uses fallback-font metrics and produces a wrong size that sticks.
        if (document.fonts?.ready) {
            document.fonts.ready.then(() => {
                if (containerRef.current && textRef.current) fit();
            });
        }
    }, [text, maxPx, minPx]);

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
            <p
                ref={textRef}
                className={className}
                style={{ fontSize: maxPx + 'px', ...style }}
            >
                {text}
            </p>
        </div>
    );
}

export default FitText;
