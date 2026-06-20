import { useState } from 'react'
import { Bot, AlertTriangle } from 'lucide-react'
import AIGeneratedBlock from '../ui/AIGeneratedBlock'
import Button from '../ui/Button'
import { chartEntries } from '../../fixtures/chartEntries'

function confidenceTier(confidence) {
  if (confidence >= 0.8) return { bar: 'bg-green-500', label: 'HIGH', text: 'text-green-700' }
  if (confidence >= 0.5) return { bar: 'bg-yellow-400', label: 'MEDIUM', text: 'text-yellow-700' }
  return { bar: 'bg-red-500', label: 'LOW', text: 'text-red-700' }
}

export default function SpecialtyPredictionCard({ prediction, specialtyOptions = [], onAccept, onOverride }) {
  const [expandedRefId, setExpandedRefId] = useState(null)
  const [overriding, setOverriding] = useState(false)

  if (!prediction) return null

  const { specialty, confidence, rationale, sourceRefs = [], warnings = [] } = prediction
  const tier = confidenceTier(confidence)
  const expandedEntry = expandedRefId
    ? chartEntries.find((e) => e.id === expandedRefId)
    : null

  return (
    <AIGeneratedBlock label={`AI-assisted · ${specialty}`} className="w-full">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Bot className="h-5 w-5 text-ai-text" />
        AI Specialty Prediction
      </div>

      <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">{specialty}</h3>

      <div className="mt-2 flex items-center gap-3">
        <div className="h-2.5 flex-1 rounded-full bg-slate-200">
          <div
            className={`h-2.5 rounded-full ${tier.bar}`}
            style={{ width: `${Math.round(confidence * 100)}%` }}
          />
        </div>
        <span className="text-sm text-slate-600">{Math.round(confidence * 100)}% confidence</span>
        <span className={`text-xs font-semibold ${tier.text}`}>{tier.label}</span>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Rationale</p>
        <p className="mt-1 text-sm text-slate-700">{rationale}</p>
      </div>

      {sourceRefs.length > 0 && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Source chart references</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {sourceRefs.map((ref) => (
              <button
                key={ref.chartEntryId}
                onClick={() => setExpandedRefId(expandedRefId === ref.chartEntryId ? null : ref.chartEntryId)}
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
          Accept & Continue
        </Button>
        <div className="relative">
          <Button variant="secondary" onClick={() => setOverriding((v) => !v)}>
            Override Specialty ▾
          </Button>
          {overriding && (
            <div className="absolute left-0 z-10 mt-1 w-56 rounded-md border border-slate-200 bg-white shadow-lg">
              {specialtyOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setOverriding(false)
                    onOverride?.(opt)
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AIGeneratedBlock>
  )
}
