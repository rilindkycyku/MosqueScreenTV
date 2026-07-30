// Single source of truth for the app version shown in the UI.
// The value is injected at build time from package.json (see vite.config.js),
// so bumping the version there is the only step needed for a release.
// The fallback keeps the footer readable if the bundle is ever built without
// the define (e.g. a bare esbuild/rollup run).
export const APP_VERSION =
    typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";
