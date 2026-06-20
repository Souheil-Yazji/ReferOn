import Spinner from './Spinner'

const variantClasses = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-700 disabled:bg-brand-100 disabled:text-brand-700 dark:disabled:bg-brand-900 dark:disabled:text-brand-300',
  secondary:
    'bg-white text-brand-700 border border-brand-500 hover:bg-brand-50 disabled:opacity-50 dark:bg-slate-800 dark:text-brand-300 dark:border-brand-500 dark:hover:bg-slate-700',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-100 disabled:text-red-400 dark:disabled:bg-red-950 dark:disabled:text-red-400',
  warning:
    'bg-yellow-400 text-yellow-950 hover:bg-yellow-500 disabled:bg-yellow-100 disabled:text-yellow-400 dark:disabled:bg-yellow-950 dark:disabled:text-yellow-700',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" className={variant === 'primary' || variant === 'danger' ? 'text-white' : ''} />}
      {children}
    </button>
  )
}
