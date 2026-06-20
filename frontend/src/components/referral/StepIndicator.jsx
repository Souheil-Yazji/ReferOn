import { Check } from 'lucide-react'

const STEPS = [
  'Select Patient',
  'Review Chart',
  'AI Prediction',
  'Edit Draft',
  'Preferences',
  'Match Specialist',
  'Preview & Send',
]

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1
        const completed = stepNum < currentStep
        const current = stepNum === currentStep
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  completed
                    ? 'bg-brand-500 text-white'
                    : current
                      ? 'bg-white text-brand-700 ring-2 ring-brand-500'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {completed ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span className="mt-1 w-20 text-center text-[11px] text-slate-500">{label}</span>
            </div>
            {stepNum < STEPS.length && (
              <div className={`mx-1 h-0.5 flex-1 ${completed ? 'bg-brand-500' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
