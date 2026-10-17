import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import RemotePage from './remote/RemotePage.jsx'
import '@fontsource/bebas-neue'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/500.css'
import '@fontsource/outfit/700.css'
import '@fontsource/outfit/800.css'
import '@fontsource/amiri'
import '@fontsource/amiri/700.css'
import './index.css'
import { restoreFromBackup } from './lib/settingsBackup'

const isRemotePage = window.location.pathname === '/remote';
if (isRemotePage) document.documentElement.classList.add('remote-page');

const render = () => ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {isRemotePage ? <RemotePage /> : <App />}
    </React.StrictMode>,
)

// The TV refills localStorage from its backups before anything reads it
// (see lib/settingsBackup.js); the phone page has no settings to restore.
if (isRemotePage) render();
else restoreFromBackup().then(render, render);
