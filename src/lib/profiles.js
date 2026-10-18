// lib/profiles.js — what picking a mosque from "Zgjidh nga lista" writes.
//
// Profiles in profiles.json are partial: each lists only what that mosque
// sets. They used to be applied as a patch over the current settings, so every
// key a profile left out kept whatever the PREVIOUS mosque had put there.
// Switching from Xhamia e Dushkajës to Xhamia e Dubravës kept Dushkaja's QR
// link (https://xhamiaedushkajes.org), and the same went for manual prayer
// times, iqamah, durations and the Ramadan setup.
//
// A profile describes a whole mosque, so it now starts from the factory
// defaults (config.json) for every mosque-specific key and lays the profile
// over them. Settings that belong to the screen rather than the mosque
// (customMsg, keepaliveVideo) are not touched. The TV panel and the phone
// remote both go through profilePatch(), so they cannot drift apart.

import config from "../data/config.json";

export const PROFILE_KEYS = [
    "name", "address", "imamName", "location",
    "manualDreka", "manualXhuma1", "manualXhuma2", "xhuma2Active",
    "appMode", "showQr", "qrUrl",
    "showSilenceWarning", "showProhibitedTimes", "showQuranRadio",
    "durations", "iqamah", "ramazan",
];

const isPlainObject = (v) => v != null && typeof v === "object" && !Array.isArray(v);

function merge(base, over) {
    if (!isPlainObject(base) || !isPlainObject(over)) return over === undefined ? base : over;
    const out = { ...base };
    Object.keys(over).forEach((k) => { out[k] = merge(base[k], over[k]); });
    return out;
}

// Full values for every mosque-specific key: default, then the profile.
export function profilePatch(profile) {
    const defaults = { ...config.tvOptions, ramazan: config.ramazan };
    const patch = {};
    PROFILE_KEYS.forEach((k) => {
        patch[k] = merge(defaults[k], profile ? profile[k] : undefined);
    });
    return patch;
}
