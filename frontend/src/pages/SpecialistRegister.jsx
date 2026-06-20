import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import FutureLabel from '../components/ui/FutureLabel'
import { registerSpecialist } from '../api/specialists'
import { useDemoContext } from '../context/useDemoContext'
import { specialtyTaxonomy } from '../fixtures/specialtyTaxonomy'
import { geocodeCity } from '../fixtures/cityLookup'
import { useTranslation } from '../i18n/useTranslation'
import { getLocalizedSpecialtyGroups } from '../i18n/specialtyLabels'

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}

const EMPTY_FORM = {
  name: '',
  clinic: '',
  specialty: specialtyTaxonomy[0],
  subspecialty: '',
  gender: '',
  acceptedCaseTypes: '',
  city: '',
  email: '',
  acceptingReferrals: true,
  nextAvailable: '',
  languages: '',
}

export default function SpecialistRegister() {
  const { addSpecialist } = useDemoContext()
  const { t, lang } = useTranslation()
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)

  const specialtyGroups = getLocalizedSpecialtyGroups(lang)

  const set = (field) => (e) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const location = geocodeCity(form.city)
    const specialist = await registerSpecialist({
      name: form.name,
      clinic: form.clinic,
      specialty: form.specialty,
      subspecialty: form.subspecialty,
      gender: form.gender,
      acceptedCaseTypes: form.acceptedCaseTypes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      location,
      contactEmail: form.email,
      acceptingReferrals: form.acceptingReferrals,
      nextAvailable: form.nextAvailable,
      languages: form.languages
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })
    addSpecialist({
      ...specialist,
      gender: form.gender,
      location: specialist.locations?.[0] ?? location,
      languages: form.languages.split(',').map((s) => s.trim()).filter(Boolean),
      nextAvailable: form.nextAvailable,
    })
    setSubmitting(false)
    setRegistered(true)
  }

  if (registered) {
    return (
      <div className="mx-auto max-w-lg px-6 py-12">
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {t('register.successTitle')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('register.successBody')}</p>
          <FutureLabel>{t('register.successFuture')}</FutureLabel>
          <Button
            variant="secondary"
            onClick={() => {
              setForm(EMPTY_FORM)
              setRegistered(false)
            }}
          >
            {t('register.registerAnother')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {t('register.title')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('register.fullName')}>
            <input required type="text" value={form.name} onChange={set('name')} className={inputClass} />
          </Field>
          <Field label={t('register.clinicName')}>
            <input required type="text" value={form.clinic} onChange={set('clinic')} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('register.specialty')}>
              <select value={form.specialty} onChange={set('specialty')} className={inputClass}>
                {specialtyGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label={t('register.subspecialty')}>
              <input type="text" value={form.subspecialty} onChange={set('subspecialty')} className={inputClass} />
            </Field>
          </div>
          <Field label={t('register.gender')}>
            <select required value={form.gender} onChange={set('gender')} className={inputClass}>
              <option value="">{t('register.genderPlaceholder')}</option>
              <option value="male">{t('register.genderMale')}</option>
              <option value="female">{t('register.genderFemale')}</option>
              <option value="non-binary">{t('register.genderNonBinary')}</option>
            </select>
          </Field>
          <Field label={t('register.acceptedCaseTypes')}>
            <input
              type="text"
              placeholder={t('register.acceptedCaseTypesPlaceholder')}
              value={form.acceptedCaseTypes}
              onChange={set('acceptedCaseTypes')}
              className={inputClass}
            />
          </Field>
          <Field label={t('register.cityLocation')}>
            <input
              required
              type="text"
              placeholder={t('register.cityPlaceholder')}
              value={form.city}
              onChange={set('city')}
              className={inputClass}
            />
          </Field>
          <Field label={t('register.contactEmail')}>
            <input required type="email" value={form.email} onChange={set('email')} className={inputClass} />
          </Field>
          <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 dark:border-slate-600">
            <span className="text-sm text-slate-700 dark:text-slate-200">{t('register.acceptingReferrals')}</span>
            <input
              type="checkbox"
              checked={form.acceptingReferrals}
              onChange={set('acceptingReferrals')}
              className="h-4 w-4"
            />
          </div>
          <Field label={t('register.nextAvailable')}>
            <input
              required
              type="date"
              value={form.nextAvailable}
              onChange={set('nextAvailable')}
              className={inputClass}
            />
          </Field>
          <Field label={t('register.languagesSpoken')}>
            <input
              type="text"
              placeholder={t('register.languagesPlaceholder')}
              value={form.languages}
              onChange={set('languages')}
              className={inputClass}
            />
          </Field>
          <Button type="submit" variant="primary" loading={submitting} className="w-full">
            {t('register.register')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
