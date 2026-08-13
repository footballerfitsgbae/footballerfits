import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'
import Maintenance from './components/Maintenance.jsx'

// Maintenance gate — when VITE_MAINTENANCE_MODE=true the site shows the holding
// page instead of the app. Anything else (false / unset) renders normally, so
// the Vercel preview URL keeps showing the real site.
const MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {MAINTENANCE ? <Maintenance /> : <App />}
  </StrictMode>,
)
