import { Check } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'

const STEP_KEYS = [
  'steps.selectPatient',
  'steps.reviewChart',
  'steps.aiPrediction',
  'steps.editDraft',
  'steps.preferences',
  'steps.matchSpecialist',
  'steps.previewSend',
]

export default function StepIndicator({ currentStep, onStepClick }) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center">
      {STEP_KEYS.map((key, idx) => {
        const label = t(key)
        const stepNum = idx + 1
        const completed = stepNum < currentStep
        const current = stepNum === currentStep
        const circleClass = `flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
          completed
            ? 'bg-brand-500 text-white'
            : current
              ? 'bg-white text-brand-700 ring-2 ring-brand-500 dark:bg-slate-800 dark:text-brand-200'
              : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
        }`
        return (
          <div key={key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              {completed ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(stepNum)}
                  className={`${circleClass} cursor-pointer hover:ring-2 hover:ring-brand-300`}
                  aria-label={t('shared.backToStep', { label })}
                >
                  <Check className="h-4 w-4" />
                </button>
              ) : (
                <div className={circleClass}>{stepNum}</div>
              )}
              <span className="mt-1 w-20 text-center text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            {stepNum < STEP_KEYS.length && (
              <div className={`mx-1 h-0.5 flex-1 ${completed ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
