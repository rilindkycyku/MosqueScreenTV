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

const isRemotePage = window.location.pathname === '/remote';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {isRemotePage ? <RemotePage /> : <App />}
    </React.StrictMode>,
)
