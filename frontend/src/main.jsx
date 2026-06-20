import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { DemoProvider } from './context/DemoContext'
import { AppSettingsProvider } from './context/AppSettingsContext'
import { ToastProvider } from './components/ui/Toast'

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <AppSettingsProvider>
        <DemoProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </DemoProvider>
      </AppSettingsProvider>
    </BrowserRouter>
  </StrictMode>,
)
