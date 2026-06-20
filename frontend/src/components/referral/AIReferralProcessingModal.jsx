import { useEffect, useState } from 'react'
import { Check, Shield, UserX, Lock, Sparkles } from 'lucide-react'
import Spinner from '../ui/Spinner'
import { useTranslation } from '../../i18n/useTranslation'

const STEP_IDS = ['deidentify', 'anonymize', 'secure', 'analyze']
const STEP_ICONS = { deidentify: UserX, anonymize: Shield, secure: Lock, analyze: Sparkles }

const STEP_INTERVAL_MS = 2000

function StepRow({ label, icon: Icon, status }) {
  const isDone = status === 'done'
  const isActive = status === 'active'

  return (
    <li
      className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
        isActive ? 'bg-brand-50' : isDone ? 'bg-green-50/80' : 'bg-slate-50/40'
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isDone
            ? 'bg-green-100 text-green-700'
            : isActive
              ? 'bg-brand-100 text-brand-700'
              : 'bg-slate-100 text-slate-400'
        }`}
      >
        {isDone ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : isActive ? (
          <Spinner size="sm" />
        ) : (
          <Icon className="h-4 w-4" aria-hidden />
        )}
      </div>
      <p
        className={`text-sm font-medium ${
          isActive ? 'text-brand-900' : isDone ? 'text-green-900' : 'text-slate-400'
        }`}
      >
        {label}
      </p>
    </li>
  )
}

export default function AIReferralProcessingModal() {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((current) => Math.min(current + 1, STEP_IDS.length - 1))
    }, STEP_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-referral-modal-title"
      aria-busy="true"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <Shield className="h-7 w-7 text-brand-600" aria-hidden />
          </div>
          <h3
            id="ai-referral-modal-title"
            className="text-xl font-semibold tracking-tight text-slate-900"
          >
            {t('privacy.title')}
          </h3>
          <p className="mt-2 text-sm text-slate-600">{t('privacy.subtitle')}</p>
        </div>

        <ol className="mt-8 space-y-1" aria-label={t('privacy.stepsLabel')}>
          {STEP_IDS.map((id, index) => (
            <StepRow
              key={id}
              label={t(`privacy.step${id.charAt(0).toUpperCase()}${id.slice(1)}`)}
              icon={STEP_ICONS[id]}
              status={index < activeStep ? 'done' : index === activeStep ? 'active' : 'pending'}
            />
          ))}
        </ol>
      </div>
    </div>
  )
}
