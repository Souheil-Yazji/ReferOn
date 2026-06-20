import Button from '../ui/Button'
import { useTranslation } from '../../i18n/useTranslation'

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

export default function PatientPreferencesForm({ preferences, onChange, onSubmit }) {
  const { t } = useTranslation()
  const set = (field) => (e) => onChange({ ...preferences, [field]: e.target.value })

  return (
    <div className="space-y-5">
      <Field label={t('preferences.maxDistance')}>
        <select
          value={preferences.maxDistanceKm == null || preferences.maxDistanceKm === Infinity ? 'any' : preferences.maxDistanceKm}
          onChange={(e) =>
            onChange({
              ...preferences,
              maxDistanceKm: e.target.value === 'any' ? Infinity : Number(e.target.value),
            })
          }
          className={inputClass}
        >
          <option value="10">{t('preferences.distance10')}</option>
          <option value="25">{t('preferences.distance25')}</option>
          <option value="50">{t('preferences.distance50')}</option>
          <option value="any">{t('preferences.distanceAny')}</option>
        </select>
      </Field>

      <Field label={t('preferences.preferredLanguage')}>
        <input
          type="text"
          value={preferences.preferredLanguage || ''}
          onChange={set('preferredLanguage')}
          placeholder={t('preferences.languagePlaceholder')}
          className={inputClass}
        />
      </Field>

      <Field label={t('preferences.genderPreference')}>
        <select value={preferences.gender || ''} onChange={set('gender')} className={inputClass}>
          <option value="">{t('preferences.genderNone')}</option>
          <option value="female">{t('preferences.genderFemale')}</option>
          <option value="male">{t('preferences.genderMale')}</option>
          <option value="non-binary">{t('preferences.genderNonBinary')}</option>
        </select>
      </Field>

      <Field label={t('preferences.otherNotes')}>
        <textarea rows={2} value={preferences.otherNotes || ''} onChange={set('otherNotes')} className={inputClass} />
      </Field>

      <div className="flex justify-end">
        <Button variant="primary" onClick={onSubmit}>
          {t('preferences.findSpecialists')}
        </Button>
      </div>
    </div>
  )
}
