import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Stethoscope, RotateCcw } from 'lucide-react'
import PhysicianView from './pages/PhysicianView'
import SpecialistRegister from './pages/SpecialistRegister'
import SpecialistPortal from './pages/SpecialistPortal'
import DemoReset from './pages/DemoReset'
import { useDemoContext } from './context/useDemoContext'

const PERSONAS = [
  { id: 'physician', label: 'Physician', path: '/' },
  { id: 'specialist', label: 'Specialist Portal', path: '/specialist/portal' },
]

function TopNav() {
  const { persona, setPersona } = useDemoContext()
  const location = useLocation()

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-2">
        <Stethoscope className="h-5 w-5 text-brand-500" />
        <span className="font-semibold tracking-tight text-slate-900">ReferOn</span>
      </div>

      <div className="flex items-center gap-2">
        {PERSONAS.map((p) => (
          <Link
            key={p.id}
            to={p.path}
            onClick={() => setPersona(p.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              (persona === p.id && location.pathname === p.path) || location.pathname === p.path
                ? 'bg-brand-100 text-brand-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p.label}
          </Link>
        ))}
        <Link
          to="/specialist/register"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            location.pathname === '/specialist/register' ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Register Specialist
        </Link>
      </div>

      <Link
        to="/demo/reset"
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <RotateCcw className="h-4 w-4" />
        Demo Reset
      </Link>
    </nav>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
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
