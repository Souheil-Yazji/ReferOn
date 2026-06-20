import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Stethoscope, RotateCcw } from 'lucide-react'
import PhysicianView from './pages/PhysicianView'
import SpecialistRegister from './pages/SpecialistRegister'
import SpecialistPortal from './pages/SpecialistPortal'
import DemoReset from './pages/DemoReset'
import { useDemoContext } from './context/useDemoContext'
import LocaleThemeControls from './components/ui/LocaleThemeControls'
import { useTranslation } from './i18n/useTranslation'

function DemoCacheToggle() {
  const { demoCacheEnabled, toggleDemoCache } = useDemoContext()
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={toggleDemoCache}
      title={demoCacheEnabled ? t('demoCache.titleOn') : t('demoCache.titleOff')}
      className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
        demoCacheEnabled
          ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      {demoCacheEnabled ? t('demoCache.on') : t('demoCache.off')}
    </button>
  )
}

function TopNav() {
  const { persona, setPersona } = useDemoContext()
  const { t } = useTranslation()
  const location = useLocation()

  const linkClass = (active) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      active
        ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-5 w-5 text-brand-500 dark:text-brand-400" />
        <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {t('nav.brand')}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/"
          onClick={() => setPersona('physician')}
          className={linkClass(persona === 'physician' && location.pathname === '/')}
        >
          {t('nav.physician')}
        </Link>
        <Link
          to="/specialist/portal"
          onClick={() => setPersona('specialist')}
          className={linkClass(location.pathname === '/specialist/portal')}
        >
          {t('nav.specialistPortal')}
        </Link>
        <Link
          to="/specialist/register"
          className={linkClass(location.pathname === '/specialist/register')}
        >
          {t('nav.registerSpecialist')}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <LocaleThemeControls />
        <DemoCacheToggle />
        <Link
          to="/demo/reset"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <RotateCcw className="h-4 w-4" />
          {t('nav.demoReset')}
        </Link>
      </div>
    </nav>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <TopNav />
      <Routes>
        <Route path="/" element={<PhysicianView />} />
        <Route path="/specialist/register" element={<SpecialistRegister />} />
        <Route path="/specialist/portal" element={<SpecialistPortal />} />
        <Route path="/demo/reset" element={<DemoReset />} />
      </Routes>
    </div>
  )
}

export default App
