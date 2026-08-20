# CLAUDE.md

Guidance for AI assistants working in this repository. Read this before touching code.

## What this is

**MosqueScreenTV** — an information screen for mosques. React 18 + Vite SPA that turns any Smart TV
into a display showing prayer times, the next prayer's countdown, rotating verses and narrations,
announcements, and a Ramadan module.

Three things shape every decision here, and they are not the usual web-app assumptions:

1. **The target is a cheap Smart TV browser**, often years old. `@vitejs/plugin-legacy` targets
   Chrome ≥ 49 / Safari ≥ 10 / Samsung ≥ 4 for a reason. Assume no modern JS, weak GPU, little RAM.
2. **It runs 24/7 and is never closed.** The document is parsed once and then lives for weeks. Any
   leak, any unbounded array, any interval that stacks up will eventually take the screen down in a
   mosque where nobody is watching.
3. **There is no backend, and no network is assumed.** Prayer times are bundled JSON and computed
   locally. Settings live in `localStorage`. The PWA precaches everything, including the scenery
   images and the keepalive video, so a screen with dead wifi keeps working exactly as before.

The only network traffic is optional analytics and the PeerJS broker used for *signaling only* by
the phone remote. **Never introduce a backend** and never make the display depend on a fetch.

Everything user-facing is **Albanian**. Deployed as a static SPA (`vercel.json` rewrites every
non-file route to `index.html`).

## Commands

```bash
npm install       # .npmrc sets legacy-peer-deps=true — needed, don't remove it
npm run dev       # vite --host (the --host matters: you test on a TV on the LAN)
npm run build
npm run preview
node scripts/convert-to-webp.mjs   # one-off: re-encode public/images scenery to webp
```

There is **no test suite and no linter configured**. Verification is manual, in a browser and
ideally on a real TV, and the commit body is where you say what you checked.

## House style

- **Comments explain the failure they prevent.** The strongest files here (`lib/analytics.js`,
  `remote/useMosqueRemote.js`, `vite.config.js`, `remote/passcodeUtils.js`) open with a block
  comment naming what quietly broke and why the code is shaped the way it is. Match that.
- Identifiers are a **mix of Albanian and English**: `vaktet`, `xhemati`, `vaktiSot`, `neMinuta`,
  `formatDallim`, `listaNamazeve` sit alongside `settings`, `durations`, `displayMode`. Match the
  file you are editing rather than renaming across the boundary.
- Commit subjects are mixed: some conventional (`fix(tv): …`, `chore: bump version to 1.16.2`),
  some plain Albanian (`Perditesime te ndryshme`). Read `git log` and follow the nearby style.
- **Never leave English text on the screen.** UI copy is Albanian.

## Layout

```
src/
  App.jsx                  ~1100 lines: settings, the prayer-time computation, the display cycle,
                           the self-healing timers. The heart of the app.
  main.jsx
  index.css                Tailwind entry + global styles
  components/
    Display/               Clock, PrayerGrid, NextPrayer, ActivityBox, SilenceNotice,
                           QuranRadio, FitText
    SettingsModal/         The on-TV settings panel; sections/ is one file per tab
    ConfirmDialog/, ErrorBoundary/
  remote/                  The phone remote: TV-side hook, phone-side page, passcode hashing
  data/                    Bundled JSON — prayer times, narrations, names, config, profiles
  lib/                     analytics.js, version.js
  assets/scenery/          Background images (webp)
scripts/convert-to-webp.mjs
public/images/             Textures, logo, og-image, silent.mp4
```

### The data files

| File | What it holds |
|---|---|
| `vaktet-e-namazit.json` | Kosovo prayer-time calendar: one row per day, `"Date": "1-Jan"`, times as `H:mm` strings, plus `Festat` and `Shenime` |
| `vaktet-e-namazit-al.json` | The same for Albania; `settings.location` (`ks`/`al`) picks between them |
| `hadithe.json` | `{ a: [...] }` of verses and narrations: `textContent`, `reference`, `type`, `tags[]` |
| `esmaul-husna.json` | The names, filtered at import to those with a `translations.sq` |
| `config.json` | The factory defaults for every setting — `tvOptions`, `durations`, `iqamah`, `ramazan` |
| `profiles.json` | Per-mosque presets picked from the settings panel; `.json.example` documents the shape |

Prayer times are **data, not a calculation** — the calendars are authored elsewhere and shipped.
Updating them is a patch release, not a feature.

**`hadithe.json` is generated upstream, not authored here.** It comes from the `KohetENamazitWatchOS`
repository's `tools/build_hadithe.py`, which writes this file with
`--tv-out ../MosqueScreenTV/src/data/hadithe.json`. Editing it here is fine for a one-off fix, but
the next regeneration overwrites it — a lasting change belongs in that repo's `narrations_*.py` or
its curated seed. The `type` and `tags` fields (including `xhuma`) are produced there, which is why
the Friday filter works at all.

## Architecture rules

### 1. Everything is local and synchronous

The whole day's schedule — Imsaku, Sabahu, Lindja, Dreka, Xhumaja, Ikindia, Akshami, Jacia, plus
Ramadan's Teravia and night prayer — is derived from bundled JSON in `useMemo`s in `App.jsx`. No
fetch is on the path to drawing a prayer time, and none may be added. A screen with no internet must
show exactly what a screen with internet shows.

### 2. Settings: defaults in `config.json`, live state in `localStorage`

`config.json` holds the shipped defaults. The running settings are one `tv_settings` object in
`localStorage`, and Reset writes the defaults back. `profiles.json` entries are *partial* patches a
user applies over the current settings.

Patches from the phone remote go through a **deep merge** — plain objects merge recursively,
everything else is replaced — so changing one key inside `durations`, `iqamah` or `ramazan` doesn't
wipe its siblings. Use it; a shallow spread is a bug here.

`saveToSafety` keeps a last-known-good copy under `safety_*` keys, so a bad state can't leave the
screen blank.

### 3. Self-healing is a feature, not a hack

The app watches itself and reloads when it can do so unnoticed:

- A periodic refresh, and a reload if frame timing degrades for ~15 s.
- **Both are gated on `!isNearPrayer` and `navigator.onLine`** and only fire while the screen is in
  its idle rotation, never during a countdown and never while settings are open. A reload during the
  minute before Sabah is the one thing this must never do.

If you add another self-heal path, gate it the same way.

### 4. TV rendering discipline

- Isolate anything that ticks. The clock re-renders every second and must not drag the rest of the
  tree with it — that is why `Clock` is its own memoized component.
- Prefer `React.memo`, `useMemo` and `useCallback` here even where they'd be noise in an ordinary
  app; on this hardware they are the difference between smooth and visibly stuttering.
- Keep animation on the GPU (transform/opacity). Framer Motion is available; layout-animating a
  large tree is not.
- `FitText` handles text that must fill a fixed box across wildly different screen sizes — use it
  instead of hand-tuned font sizes.

### 5. Input: remote control first, keyboard second

The screen is driven by a TV remote. Enter/OK opens settings; `s` / `m` do the same from a keyboard,
and `r` reloads. Anything reachable only by mouse or by hover is unreachable for the actual user.
Every new control needs a key path.

### 6. The phone remote

`remote/useMosqueRemote.js` (TV side) and `remote/RemotePage.jsx` (phone side) talk over **WebRTC
via PeerJS**. The public PeerJS broker is used for **signaling only** — the TV↔phone data is
peer-to-peer, which is what lets the whole thing live on a static host.

- The TV registers under `mosquetv-<room guid>`; the guid is persisted in `localStorage` and carried
  in the QR URL as `room`.
- Auth is a short-lived rotating token (5 min) **or** a passcode. The raw passcode is never stored —
  only its SHA-256 hash, with a pure-JS fallback because `crypto.subtle` doesn't exist over plain
  HTTP on a local network.
- Messages are a small typed set (`AUTH`, `AUTH_OK`, `AUTH_FAIL`, settings patches, `RELOAD_PAGE`).
  Adding one means handling it on both sides and keeping older builds tolerant of what they don't
  know.

### 7. Offline is the default, so caching is deliberate

`vite.config.js` is worth reading before you touch the PWA config. Three non-obvious pieces:

- The silent keepalive video is cached through **`RangeRequestsPlugin`**. Without it the service
  worker answers `200` where the `<video>` element needs `206`, and the video stalls offline —
  which lets the TV sleep.
- `maximumFileSizeToCacheInBytes` is raised to 20 MB for the high-resolution scenery.
- Analytics is `NetworkOnly` with **Background Sync**, so a hit made during a dead connection is
  replayed rather than dropped.

`lib/analytics.js` then tags replayed hits with `offline_replay` / `offline_time`, because GA4
stamps a hit when it *arrives* — without that, last night's power cut looks like it happened at
breakfast. It also re-sends `page_view` after the GA4 session timeout and beats a heartbeat, because
on a screen that is never closed the single mount-time hit is otherwise the only one GA ever sees.

## Releases

`package.json` `version` is the single source of truth. `vite.config.js` injects it as
`__APP_VERSION__`, `src/lib/version.js` reads it (with a `"0.0.0"` fallback), and the settings
footer shows it.

1. Bump `version` — minor for a new capability, patch for fixes, optimizations and **data updates**.
2. Add a row at the top of the `CHANGELOG.md` table: version, date, commit hash, one-line Albanian
   description. Documentation-only commits and PR merge commits do not raise the version.
3. Update `README.md` if the feature table or the settings screenshots changed.

## Gotchas

- **`.npmrc` sets `legacy-peer-deps=true`.** Installs fail without it.
- `vite.config.js` shims `global.self` before importing `workbox-range-requests`, which is why the
  config is an async function. Don't "simplify" it back to a plain object.
- Friday is special: the rotation switches to the `xhuma`-tagged entries only, and falls back to the
  full pool if that list is ever empty — the screen must never go blank on a Friday.
- `appMode` is `mosque` or `home`, and it changes what is even shown (congregation times, the
  silence notice, the night prayer). Test both when touching the schedule.
- `profiles.json` contains **real mosque data** for deployed screens. Adding a profile is a content
  change; don't reshape it without updating `profiles.json.example` too.
- Prayer times are `H:mm` strings, sometimes without a leading zero (`"5:41"`). Parse via the
  existing `neMinuta` / `ne24h` helpers rather than `Date` or string comparison.
- Scenery images are committed as `.webp`. `scripts/convert-to-webp.mjs` is a manual tool, not part
  of the build, and its delete-the-original line is commented out on purpose.
