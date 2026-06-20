import { Clock } from 'lucide-react'

export default function FutureLabel({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-future px-2.5 py-0.5 text-xs text-slate-500">
      <Clock className="h-3 w-3" />
      {children}
    </span>
  )
}
