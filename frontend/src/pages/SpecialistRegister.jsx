import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FutureLabel from '../components/ui/FutureLabel'
import { registerSpecialist } from '../api/specialists'
import { useDemoContext } from '../context/useDemoContext'
import { specialtyTaxonomy } from '../fixtures/specialtyTaxonomy'
import { geocodeCity } from '../fixtures/cityLookup'

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

const EMPTY_FORM = {
  name: '',
  clinic: '',
  specialty: specialtyTaxonomy[0],
  subspecialty: '',
  acceptedCaseTypes: '',
  city: '',
  email: '',
  acceptingReferrals: true,
  nextAvailable: '',
  languages: '',
}

export default function SpecialistRegister() {
  const { addSpecialist } = useDemoContext()
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const location = geocodeCity(form.city)
    const specialist = await registerSpecialist({
      name: form.name,
      clinic: form.clinic,
      specialty: form.specialty,
      subspecialty: form.subspecialty,
      acceptedCaseTypes: form.acceptedCaseTypes.split(',').map((s) => s.trim()).filter(Boolean),
      location,
      contactEmail: form.email,
      acceptingReferrals: form.acceptingReferrals,
      nextAvailable: form.nextAvailable,
      languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
    })
    addSpecialist(specialist)
    setSubmitting(false)
    setRegistered(true)
  }

  if (registered) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12">
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">You're registered!</h2>
          <p className="text-sm text-slate-600">You'll appear in referral matches.</p>
          <FutureLabel>Credential verification coming in production</FutureLabel>
          <Button variant="secondary" onClick={() => { setForm(EMPTY_FORM); setRegistered(false) }}>
            Register another specialist
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Specialist Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name">
            <input required type="text" value={form.name} onChange={set('name')} className={inputClass} />
          </Field>
          <Field label="Clinic name">
            <input required type="text" value={form.clinic} onChange={set('clinic')} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Specialty">
              <select value={form.specialty} onChange={set('specialty')} className={inputClass}>
                {specialtyTaxonomy.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subspecialty">
              <input type="text" value={form.subspecialty} onChange={set('subspecialty')} className={inputClass} />
            </Field>
          </div>
          <Field label="Accepted case types">
            <input
              type="text"
              placeholder="e.g. knee replacement, ACL repair"
              value={form.acceptedCaseTypes}
              onChange={set('acceptedCaseTypes')}
              className={inputClass}
            />
          </Field>
          <Field label="City / location">
            <input required type="text" placeholder="e.g. Toronto" value={form.city} onChange={set('city')} className={inputClass} />
          </Field>
          <Field label="Contact email">
            <input required type="email" value={form.email} onChange={set('email')} className={inputClass} />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
            <span className="text-sm text-slate-700">Accepting new referrals</span>
            <input type="checkbox" checked={form.acceptingReferrals} onChange={set('acceptingReferrals')} className="h-4 w-4" />
          </div>
          <Field label="Next available date">
            <input required type="date" value={form.nextAvailable} onChange={set('nextAvailable')} className={inputClass} />
          </Field>
          <Field label="Languages spoken">
            <input
              type="text"
              placeholder="e.g. English, French"
              value={form.languages}
              onChange={set('languages')}
              className={inputClass}
            />
          </Field>
          <Button type="submit" variant="primary" loading={submitting} className="w-full">
            Register
          </Button>
        </form>
      </Card>
    </div>
  )
}
