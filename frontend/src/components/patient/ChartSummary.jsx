import { useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Upload } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { useTranslation } from '../../i18n/useTranslation'

const GROUPS = [
  { type: 'visit_note', labelKey: 'chart.visitNotes', variant: 'default' },
  {
    type: 'lab',
    labelKey: 'chart.labResults',
    variant: 'blue',
    uploadable: true,
    accept: '.pdf,.png,.jpg,.jpeg,.gif,.webp',
  },
  {
    type: 'imaging',
    labelKey: 'chart.imaging',
    variant: 'purple',
    uploadable: true,
    accept: '.pdf,.png,.jpg,.jpeg,.gif,.webp,.dcm,.tif,.tiff',
  },
  { type: 'medication', labelKey: 'chart.medications', variant: 'green' },
  { type: 'allergy', labelKey: 'chart.allergies', variant: 'red' },
]

function EntryRow({ entry, highlighted }) {
  const [expanded, setExpanded] = useState(false)
  const fileName = entry.metadata?.fileName

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
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-900">{entry.title}</p>
            {fileName && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                {fileName}
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>
      {expanded && <p className="mt-2 text-sm text-slate-700">{entry.content}</p>}
      {!expanded && <p className="mt-1 truncate text-xs text-slate-500">{entry.content}</p>}
    </div>
  )
}

function SectionUploadButton({ accept, loading, onSelect }) {
  const inputRef = useRef(null)
  const { t } = useTranslation()

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onSelect(file)
          e.target.value = ''
        }}
      />
      <Button
        variant="secondary"
        size="sm"
        loading={loading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-3.5 w-3.5" />
        {t('chart.upload')}
      </Button>
    </>
  )
}

export default function ChartSummary({
  entries,
  highlightedIds = [],
  onUpload,
  uploadingType = null,
}) {
  const { t } = useTranslation()

  if (!entries) return null

  return (
    <div className="space-y-4">
      {GROUPS.map((group) => {
        const groupEntries = entries.filter((e) => e.type === group.type)
        if (groupEntries.length === 0 && !group.uploadable) return null
        const sectionLabel = t(group.labelKey)

        return (
          <div key={group.type}>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={group.variant}>{sectionLabel}</Badge>
              <span className="text-xs text-slate-400">{groupEntries.length}</span>
              {group.uploadable && onUpload && (
                <SectionUploadButton
                  accept={group.accept}
                  loading={uploadingType === group.type}
                  onSelect={(file) => onUpload(group.type, file)}
                />
              )}
            </div>
            {groupEntries.length === 0 ? (
              <p className="text-xs italic text-slate-400">
                {t('chart.emptySection', { section: sectionLabel })}
              </p>
            ) : (
              <div className="space-y-2">
                {groupEntries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    highlighted={highlightedIds.includes(entry.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
