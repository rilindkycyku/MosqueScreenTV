import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_ID;

export const initGA = () => {
    if (GA_MEASUREMENT_ID) {
        ReactGA.initialize(GA_MEASUREMENT_ID);
        console.log("Google Analytics initialized with ID:", GA_MEASUREMENT_ID);
    } else {
        console.warn("Google Analytics ID not found. Set VITE_GA_ID in your .env file.");
    }
};

export const logPageView = () => {
    if (GA_MEASUREMENT_ID) {
        ReactGA.send({ hitType: "pageview", page: window.location.pathname + window.location.search });
    }
};

export const logEvent = (category, action, label) => {
    if (GA_MEASUREMENT_ID) {
        ReactGA.event({
            category: category,
            action: action,
            label: label,
        });
    }
};
