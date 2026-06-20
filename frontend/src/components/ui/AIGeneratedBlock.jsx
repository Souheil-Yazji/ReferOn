import { Sparkles } from 'lucide-react'

export default function AIGeneratedBlock({ label = 'AI-assisted', children, className = '' }) {
  return (
    <div className={`relative rounded-md border-l-4 border-ai-border bg-ai-bg p-4 pt-6 ${className}`}>
      <span className="absolute right-3 top-2 inline-flex items-center gap-1 text-xs font-medium text-ai-text">
        <Sparkles className="h-3 w-3" />
        {label}
      </span>
      {children}
    </div>
  )
}
