import { Loader2 } from 'lucide-react'

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <Loader2
      className={`animate-spin text-brand-500 ${sizeMap[size]} ${className}`}
      aria-label="Loading"
    />
  )
}
