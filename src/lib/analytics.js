const GA_MEASUREMENT_ID = 'G-76Y1SQYZC1';

export const initGA = () => {
    if (GA_MEASUREMENT_ID) {
        // Dynamically inject the native Google Analytics script
        const script = document.createElement("script");
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        script.async = true;
        document.head.appendChild(script);

        // Setup the global layer
        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        window.gtag = gtag; // Export to window so it's accessible anywhere!

        gtag("js", new Date());
        gtag("config", GA_MEASUREMENT_ID);
        console.log("Native Google Analytics initialized with ID:", GA_MEASUREMENT_ID);
    } else {
        console.warn("Google Analytics ID not found. Set VITE_GA_ID in your .env file.");
    }
};

export const logPageView = () => {
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
        window.gtag("event", "page_view", {
            page_path: window.location.pathname + window.location.search
        });
    }
};

export const logEvent = (category, action, label) => {
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
        window.gtag("event", action, {
            event_category: category,
            event_label: label,
        });
    }
};
