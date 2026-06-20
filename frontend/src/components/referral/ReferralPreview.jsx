import FutureLabel from '../ui/FutureLabel'
import Button from '../ui/Button'
import ReferralStatusBadge from './ReferralStatusBadge'
import { useTranslation } from '../../i18n/useTranslation'

const fieldClass =
  'mt-1 w-full resize-none rounded-md border border-transparent bg-transparent px-0 py-0.5 text-sm text-slate-700 focus:border-brand-500 focus:bg-white focus:px-2 focus:py-1 focus:outline-none disabled:cursor-default'

function EditableField({ label, value, onChange, locked, rows = 2 }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={locked}
        className={fieldClass}
      />
    </div>
  )
}

export default function ReferralPreview({
  patient,
  physicianName,
  specialist,
  draft,
  status,
  onDraftChange,
  onSend,
  sending,
}) {
  const { t, translateSpecialty, translateUrgency } = useTranslation()
  const locked = status === 'sent'
  const set = (field) => (value) => onDraftChange?.({ ...draft, [field]: value })

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('referral.letter')}</p>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {translateSpecialty(draft.specialty)} — {translateUrgency(draft.urgency)}
          </h2>
        </div>
        <ReferralStatusBadge status={status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('shared.patient')}</p>
          <p className="text-slate-900">{patient.name}</p>
          <p className="text-xs text-slate-500">
            {t('referral.patientMeta', { ohip: patient.ohip, dob: patient.dob })}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('referral.referringPhysician')}</p>
          <p className="text-slate-900">{physicianName}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{t('referral.specialist')}</p>
        <p className="text-slate-900">
          {specialist.name} — {specialist.clinic}
        </p>
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-700">
        <EditableField
          label={t('referral.reason')}
          value={draft.reason}
          onChange={set('reason')}
          locked={locked}
          rows={2}
        />
        <EditableField
          label={t('referral.relevantHistory')}
          value={draft.relevantHistory}
          onChange={set('relevantHistory')}
          locked={locked}
          rows={3}
        />
        <EditableField
          label={t('referral.medications')}
          value={draft.medications}
          onChange={set('medications')}
          locked={locked}
        />
        <EditableField
          label={t('referral.allergies')}
          value={draft.allergies}
          onChange={set('allergies')}
          locked={locked}
        />
        <EditableField
          label={t('referral.investigations')}
          value={draft.investigations}
          onChange={set('investigations')}
          locked={locked}
          rows={3}
        />
        <EditableField
          label={t('referral.additionalNotes')}
          value={draft.additionalNotes || ''}
          onChange={set('additionalNotes')}
          locked={locked}
        />
      </div>

      <div className="mt-6 flex flex-col items-start gap-2">
        <Button variant="primary" onClick={onSend} loading={sending} disabled={status === 'sent'}>
          {status === 'sent' ? t('shared.sent') : t('referral.sendReferral')}
        </Button>
        <FutureLabel>{t('future.faxEmail')}</FutureLabel>
      </div>
    </div>
  )
}
