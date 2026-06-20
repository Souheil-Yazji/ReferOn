export default function Card({ children, className = '', as: Component = 'div', ...props }) {
  return (
    <Component
      className={`rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
