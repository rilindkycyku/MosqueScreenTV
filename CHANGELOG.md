# Changelog

Versioni i aplikacionit ndiqet me [Semantic Versioning](https://semver.org/):
`MAJOR.MINOR.PATCH` — `MINOR` për funksionalitete të reta, `PATCH` për
rregullime, optimizime dhe përditësime të dhënash.

Burimi i vetëm i së vërtetës është fusha `version` në `package.json`. Ajo
injektohet në build si `__APP_VERSION__` (shih `vite.config.js`) dhe lexohet nga
`src/lib/version.js`, që e shfaq në fund të panelit të Cilësimeve.

Versionet më poshtë janë nxjerrë duke kaluar nëpër **të gjitha commit-et** e
historisë së projektit, duke nisur nga `1.0.0` te commit-i i publikimit fillestar
(`7697480`). Commit-et që preknin vetëm dokumentacionin (README, foto për GitHub)
dhe merge-commit-et e PR-ve nuk kanë ngritur version.

| Versioni | Data | Commit | Përshkrimi |
| --- | --- | --- | --- |
| 1.15.0 | 2026-07-30 | _ky commit_ | Numri i versionit shfaqet në fund të Cilësimeve |
| 1.14.1 | 2026-07-26 | `8cfd52d` | Përditësim i të dhënave të haditheve |
| 1.14.0 | 2026-07-25 | `8fc081e` | Gjurmimi real i përdorimit PWA në Google Analytics |
| 1.13.1 | 2026-06-25 | `8878e04` | Përditësime të vogla |
| 1.13.0 | 2026-06-25 | `03780e4` | UI e re e telekomandës dhe rregullime |
| 1.12.2 | 2026-06-25 | `8bad3e9` | `vercel.json` me rewrite për SPA (404 te `/remote`) |
| 1.12.1 | 2026-06-25 | `980656f` | Diagnostikë e telekomandës + fiks për `unavailable-id` |
| 1.12.0 | 2026-06-25 | `b8f6eb9` | Telekomanda me WebRTC (PeerJS) në vend të WebSocket relay |
| 1.11.1 | 2026-06-19 | `addfbd9` | Të dhënat e Esmaul Husna, fontet vetëlokale, optimizim TV |
| 1.11.0 | 2026-06-12 | `f989916` | 99 Emrat e Allahut |
| 1.10.6 | 2026-05-01 | `3f9502d` | Pragu i modit të heshtjes 2 → 10 |
| 1.10.5 | 2026-04-24 | `2fa1010` | Rregullim i mbajtjes ndezur të TV-së |
| 1.10.4 | 2026-04-18 | `3e41353` | Rregullime të ndryshme |
| 1.10.3 | 2026-04-17 | `81ac64f` | Përditësime në UI |
| 1.10.2 | 2026-04-17 | `be50feb` | Më shumë evente në Analytics |
| 1.10.1 | 2026-04-17 | `631deb2` | Përditësime me analytics |
| 1.10.0 | 2026-04-16 | `4648aec` | Integrimi i Google Analytics |
| 1.9.4 | 2026-04-09 | `cfc9968` | Përditësim i `profiles.json` |
| 1.9.3 | 2026-04-09 | `247452a` | Përditësime të ndryshme |
| 1.9.2 | 2026-04-09 | `af1e6d8` | Përditësime në `shared.jsx` |
| 1.9.1 | 2026-04-06 | `43e3a1f` | Përmirësime tek "Always on screen" |
| 1.9.0 | 2026-04-04 | `77cea6e` | Rinovim i gjerë i UI-së (41 fajlla) |
| 1.8.3 | 2026-04-03 | `13e46f9` | Përditësime në UI dhe optimizime |
| 1.8.2 | 2026-04-03 | `339cdec` | Rregullim i crash-eve |
| 1.8.1 | 2026-04-03 | `f6e1674` | Përmirësim i PWA-së |
| 1.8.0 | 2026-04-03 | `5d55951` | PWA — qasje pa rrjet |
| 1.7.5 | 2026-04-01 | `7421b97` | Përditësim i `App.jsx` |
| 1.7.4 | 2026-03-31 | `1d3b145` | Përditësim i `index.html` |
| 1.7.3 | 2026-03-31 | `74241aa` | Përditësime në dizajn |
| 1.7.2 | 2026-03-30 | `dcd5798` | Përditësime në dizajn |
| 1.7.1 | 2026-03-25 | `2daef13` | Përditësime në TV |
| 1.7.0 | 2026-03-13 | `5073882` | Optimizim i madh, ndarja e SettingsModal në seksione |
| 1.6.1 | 2026-03-12 | `16fdedb` | Vercel Analytics |
| 1.6.0 | 2026-03-12 | `d147975` | Shumë regjione, modi shtëpi, radio live e Kur'anit |
| 1.5.3 | 2026-03-10 | `3b7fe36` | Përditësime tek ora dhe fotot |
| 1.5.2 | 2026-03-07 | `d8174a2` | Përditësime në UI dhe optimizime për TV |
| 1.5.1 | 2026-03-06 | `0a43c5c` | Rregullim tek `PrayerGrid.jsx` |
| 1.5.0 | 2026-03-06 | `7c9dc9d` | Optimizim i layout-it dhe logjika e automatizuar e namazeve |
| 1.4.0 | 2026-03-02 | `3953df0` | Rinovim i Cilësimeve për qasje më të mirë në TV |
| 1.3.1 | 2026-02-28 | `c4eb122` | Përditësime tek sabahu |
| 1.3.0 | 2026-02-28 | `13402fc` | "Platinum edition" — polish dhe optimizim i performancës |
| 1.2.0 | 2026-02-26 | `3b993a9` | Vendosja e Analytics |
| 1.1.1 | 2026-02-26 | `1a0cdde` | Përditësime në shkrim |
| 1.1.0 | 2026-02-26 | `d0f6575` | Optimizim për TV të dobëta dhe stabilitet 24/7 |
| 1.0.0 | 2026-02-25 | `7697480` | Versioni fillestar |
