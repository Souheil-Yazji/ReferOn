import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import Badge from '../ui/Badge'

const GROUPS = [
  { type: 'visit_note', label: 'Visit Notes', variant: 'default' },
  { type: 'lab', label: 'Lab Results', variant: 'blue' },
  { type: 'imaging', label: 'Imaging', variant: 'purple' },
  { type: 'medication', label: 'Medications', variant: 'green' },
  { type: 'allergy', label: 'Allergies', variant: 'red' },
]

function EntryRow({ entry, highlighted }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      className={`rounded-md border border-slate-200 p-3 ${highlighted ? 'bg-brand-50' : 'bg-white'}`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <p className="text-xs text-slate-500">{entry.date}</p>
          <p className="text-sm font-medium text-slate-900">{entry.title}</p>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {expanded && <p className="mt-2 text-sm text-slate-700">{entry.content}</p>}
      {!expanded && <p className="mt-1 truncate text-xs text-slate-500">{entry.content}</p>}
    </div>
  )
}

export default function ChartSummary({ entries, highlightedIds = [] }) {
  if (!entries) return null

  return (
    <div className="space-y-4">
      {GROUPS.map((group) => {
        const groupEntries = entries.filter((e) => e.type === group.type)
        if (groupEntries.length === 0) return null
        return (
          <div key={group.type}>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={group.variant}>{group.label}</Badge>
              <span className="text-xs text-slate-400">{groupEntries.length}</span>
            </div>
            <div className="space-y-2">
              {groupEntries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  highlighted={highlightedIds.includes(entry.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
