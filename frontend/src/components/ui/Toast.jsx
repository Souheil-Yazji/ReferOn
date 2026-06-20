import { useCallback, useRef, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { ToastContext } from './toastContext'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const showToast = useCallback((message, duration = 3000) => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, message }])
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            {toast.message}
            <button
              onClick={() => setToasts((t) => t.filter((x) => x.id !== toast.id))}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
