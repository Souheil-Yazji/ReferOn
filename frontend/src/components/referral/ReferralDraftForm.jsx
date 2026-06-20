import { AlertTriangle } from 'lucide-react'
import Button from '../ui/Button'
import { useTranslation } from '../../i18n/useTranslation'
import { getLocalizedSpecialtyGroups } from '../../i18n/specialtyLabels'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none'

const URGENCY_VALUES = ['Routine', 'Urgent', 'Emergent']

export default function ReferralDraftForm({ draft, onChange, onNext }) {
  const { t, lang, translateUrgency } = useTranslation()
  const specialtyGroups = getLocalizedSpecialtyGroups(lang)
  const set = (field) => (e) => onChange({ ...draft, [field]: e.target.value })

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-bg px-3 py-2 text-sm text-warning-text">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        {t('referral.aiReviewWarning')}
      </div>

      <Field label={t('referral.reason')}>
        <textarea rows={3} value={draft.reason} onChange={set('reason')} className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t('referral.specialty')}>
          <select value={draft.specialty} onChange={set('specialty')} className={inputClass}>
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
        <Field label={t('referral.urgency')}>
          <select value={draft.urgency} onChange={set('urgency')} className={inputClass}>
            {URGENCY_VALUES.map((value) => (
              <option key={value} value={value}>
                {translateUrgency(value)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t('referral.relevantHistory')}>
        <textarea rows={3} value={draft.relevantHistory} onChange={set('relevantHistory')} className={inputClass} />
      </Field>

      <Field label={t('referral.medications')}>
        <textarea rows={2} value={draft.medications} onChange={set('medications')} className={inputClass} />
      </Field>

      <Field label={t('referral.allergies')}>
        <textarea rows={2} value={draft.allergies} onChange={set('allergies')} className={inputClass} />
      </Field>

      <Field label={t('referral.investigations')}>
        <textarea rows={3} value={draft.investigations} onChange={set('investigations')} className={inputClass} />
      </Field>

      <Field label={t('referral.additionalNotes')}>
        <textarea rows={2} value={draft.additionalNotes} onChange={set('additionalNotes')} className={inputClass} />
      </Field>

      <div className="flex justify-end">
        <Button variant="primary" onClick={onNext}>
          {t('referral.nextPreferences')}
        </Button>
      </div>
    </div>
  )
}
