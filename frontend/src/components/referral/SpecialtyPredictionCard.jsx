import { useState } from 'react'
import { Bot, AlertTriangle } from 'lucide-react'
import AIGeneratedBlock from '../ui/AIGeneratedBlock'
import Button from '../ui/Button'
import { useTranslation } from '../../i18n/useTranslation'

export default function SpecialtyPredictionCard({ prediction, chartEntries = [], onAccept }) {
  const { t, translateSpecialty } = useTranslation()
  const [expandedRefId, setExpandedRefId] = useState(null)

  if (!prediction) return null

  const { specialty, rationale, sourceRefs = [], warnings = [] } = prediction
  const localizedSpecialty = translateSpecialty(specialty)
  const expandedEntry = expandedRefId ? chartEntries.find((e) => e.id === expandedRefId) : null

  return (
    <AIGeneratedBlock
      label={t('prediction.aiAssistedSpecialty', { specialty: localizedSpecialty })}
      className="w-full"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Bot className="h-5 w-5 text-ai-text" />
        {t('prediction.title')}
      </div>

      <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">{localizedSpecialty}</h3>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{t('prediction.rationale')}</p>
        <p className="mt-1 text-sm text-slate-700">{rationale}</p>
      </div>

      {sourceRefs.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('prediction.sourceRefs')}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {sourceRefs.map((ref) => (
              <button
                key={ref.chartEntryId}
                onClick={() =>
                  setExpandedRefId(expandedRefId === ref.chartEntryId ? null : ref.chartEntryId)
                }
                className="rounded-full border border-brand-500 bg-white px-3 py-1 text-xs text-brand-700 hover:bg-brand-50"
              >
                {ref.label}
              </button>
            ))}
          </div>
          {expandedEntry && (
            <div className="mt-2 rounded-md bg-brand-50 p-3 text-sm text-slate-700">
              {expandedEntry.content}
            </div>
          )}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-4 space-y-1">
          {warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-bg px-3 py-2 text-sm text-warning-text"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Button variant="primary" onClick={() => onAccept?.(specialty)}>
          {t('prediction.acceptContinue')}
        </Button>
      </div>
    </AIGeneratedBlock>
  )
}
