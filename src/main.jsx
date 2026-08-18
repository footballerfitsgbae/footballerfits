import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'
import Maintenance from './components/Maintenance.jsx'

// Maintenance gate — decided by hostname. Only the live custom domain shows the
// holding page; every other host (e.g. the footballerfits.vercel.app preview)
// renders the real site so the client can preview Sanity changes behind it.
const MAINTENANCE_HOSTS = ['footballerfits.co.uk', 'www.footballerfits.co.uk']
const MAINTENANCE = MAINTENANCE_HOSTS.includes(window.location.hostname)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {MAINTENANCE ? <Maintenance /> : <App />}
  </StrictMode>,
)
