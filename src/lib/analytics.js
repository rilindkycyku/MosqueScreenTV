const GA_ID = 'G-76Y1SQYZC1';

// ─── Module Level Queueing ──────────────────────────────────────────────────
// This ensures gtag() can be called even before the script finishes loading
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
window.gtag = gtag;

export const initGA = () => {
    if (!GA_ID) return;

    // Check localStorage for existing cookie consent
    let hasConsent = false;
    try {
        const raw = localStorage.getItem('cookie-consent');
        if (raw) hasConsent = JSON.parse(raw).accepted === true;
    } catch (e) {
        // Ignore parsing errors
    }

    // Set default consent mode BEFORE initializing GA
    gtag('consent', 'default', {
        'analytics_storage': hasConsent ? 'granted' : 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
    });

    gtag('js', new Date());
    gtag('config', GA_ID, {
        send_page_view: false, // We send manually via logPageView
    });

    // Inject the script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    script.async = true;
    document.head.appendChild(script);
};

export const updateConsent = (accepted) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
            'analytics_storage': accepted ? 'granted' : 'denied'
        });
    }
};

export const logPageView = () => {
    if (!GA_ID || typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
        page_path: window.location.pathname + window.location.search,
    });
};

export const logEvent = (eventName, params = {}) => {
    if (!GA_ID || typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, params);
};
