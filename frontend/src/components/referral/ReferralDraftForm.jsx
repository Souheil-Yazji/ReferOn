import AIGeneratedBlock from '../ui/AIGeneratedBlock'
import Button from '../ui/Button'
import { specialtyTaxonomy } from '../../fixtures/specialtyTaxonomy'

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

export default function ReferralDraftForm({ draft, onChange, onNext }) {
  const set = (field) => (e) => onChange({ ...draft, [field]: e.target.value })

  return (
    <div className="space-y-5">
      <Field label="Reason for referral">
        <textarea
          rows={3}
          value={draft.reason}
          onChange={set('reason')}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Specialty">
          <select value={draft.specialty} onChange={set('specialty')} className={inputClass}>
            {specialtyTaxonomy.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Urgency">
          <select value={draft.urgency} onChange={set('urgency')} className={inputClass}>
            <option>Routine</option>
            <option>Urgent</option>
            <option>Emergent</option>
          </select>
        </Field>
      </div>

      <div>
        <span className="text-xs uppercase tracking-wide text-slate-500">Relevant history</span>
        <AIGeneratedBlock label="AI-generated" className="mt-1">
          <textarea
            rows={3}
            value={draft.relevantHistory}
            onChange={set('relevantHistory')}
            className="w-full resize-none border-none bg-transparent text-sm text-slate-700 focus:outline-none"
          />
        </AIGeneratedBlock>
      </div>

      <div>
        <span className="text-xs uppercase tracking-wide text-slate-500">Medications</span>
        <AIGeneratedBlock label="AI-generated" className="mt-1">
          <textarea
            rows={2}
            value={draft.medications}
            onChange={set('medications')}
            className="w-full resize-none border-none bg-transparent text-sm text-slate-700 focus:outline-none"
          />
        </AIGeneratedBlock>
      </div>

      <div>
        <span className="text-xs uppercase tracking-wide text-slate-500">Allergies</span>
        <AIGeneratedBlock label="AI-generated" className="mt-1">
          <textarea
            rows={2}
            value={draft.allergies}
            onChange={set('allergies')}
            className="w-full resize-none border-none bg-transparent text-sm text-slate-700 focus:outline-none"
          />
        </AIGeneratedBlock>
      </div>

      <div>
        <span className="text-xs uppercase tracking-wide text-slate-500">Investigations</span>
        <AIGeneratedBlock label="AI-generated" className="mt-1">
          <textarea
            rows={3}
            value={draft.investigations}
            onChange={set('investigations')}
            className="w-full resize-none border-none bg-transparent text-sm text-slate-700 focus:outline-none"
          />
        </AIGeneratedBlock>
      </div>

      <Field label="Additional notes">
        <textarea
          rows={2}
          value={draft.additionalNotes}
          onChange={set('additionalNotes')}
          className={inputClass}
        />
      </Field>

      <div className="flex justify-end">
        <Button variant="primary" onClick={onNext}>
          Next: Patient Preferences
        </Button>
      </div>
    </div>
  )
}
