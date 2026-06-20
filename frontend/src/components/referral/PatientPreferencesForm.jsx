import Button from '../ui/Button'
import { useDemoContext } from '../../context/useDemoContext'

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

function MultiSelect({ options, selected, onToggle }) {
  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={`rounded-full border px-3 py-1 text-xs ${
              active
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {opt.name}
          </button>
        )
      })}
    </div>
  )
}

export default function PatientPreferencesForm({ preferences, onChange, onSubmit }) {
  const { specialists } = useDemoContext()
  const set = (field) => (e) => onChange({ ...preferences, [field]: e.target.value })

  const toggleInList = (field) => (id) => {
    const list = preferences[field] || []
    onChange({
      ...preferences,
      [field]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    })
  }

  return (
    <div className="space-y-5">
      <Field label="Max travel distance">
        <select
          value={preferences.maxDistanceKm ?? 'any'}
          onChange={(e) =>
            onChange({
              ...preferences,
              maxDistanceKm: e.target.value === 'any' ? Infinity : Number(e.target.value),
            })
          }
          className={inputClass}
        >
          <option value="10">10 km</option>
          <option value="25">25 km</option>
          <option value="50">50 km</option>
          <option value="any">Any</option>
        </select>
      </Field>

      <Field label="Preferred language">
        <input
          type="text"
          value={preferences.preferredLanguage || ''}
          onChange={set('preferredLanguage')}
          placeholder="e.g. French"
          className={inputClass}
        />
      </Field>

      <div>
        <span className="text-xs uppercase tracking-wide text-slate-500">Preferred specialists</span>
        <MultiSelect
          options={specialists}
          selected={preferences.preferredSpecialistIds || []}
          onToggle={toggleInList('preferredSpecialistIds')}
        />
      </div>

      <div>
        <span className="text-xs uppercase tracking-wide text-slate-500">Excluded specialists</span>
        <MultiSelect
          options={specialists}
          selected={preferences.excludedSpecialistIds || []}
          onToggle={toggleInList('excludedSpecialistIds')}
        />
      </div>

      <Field label="Timing notes">
        <textarea
          rows={2}
          value={preferences.timingNotes || ''}
          onChange={set('timingNotes')}
          placeholder="e.g. Patient works nights, prefers morning appointments"
          className={inputClass}
        />
      </Field>

      <Field label="Other notes">
        <textarea
          rows={2}
          value={preferences.otherNotes || ''}
          onChange={set('otherNotes')}
          className={inputClass}
        />
      </Field>

      <div className="flex justify-end">
        <Button variant="primary" onClick={onSubmit}>
          Find Specialists
        </Button>
      </div>
    </div>
  )
}
