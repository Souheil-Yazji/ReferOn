import { useEffect, useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import { searchPatients } from '../../api/patients'
import PatientCard from './PatientCard'
import Spinner from '../ui/Spinner'
import { useTranslation } from '../../i18n/useTranslation'

export default function PatientSearch({ onSelect }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    startTransition(async () => {
      try {
        const data = await searchPatients(query)
        if (cancelled) return
        setResults(data)
        setError(false)
      } catch {
        if (cancelled) return
        setError(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [query, startTransition])

  const status = isPending ? 'loading' : error ? 'error' : results.length === 0 ? 'empty' : 'done'

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('patient.searchPlaceholder')}
          className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <div className="mt-4 space-y-2">
        {status === 'loading' && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}
        {status === 'error' && (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {t('patient.searchError')}
            <button onClick={() => setQuery((q) => q)} className="ml-2 font-semibold underline">
              {t('shared.tryAgain')}
            </button>
          </div>
        )}
        {status === 'empty' && (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('patient.searchEmpty')}
          </p>
        )}
        {status === 'done' &&
          results.map((patient) => (
            <PatientCard key={patient.id} patient={patient} onClick={() => onSelect(patient)} />
          ))}
      </div>
    </div>
  )
}
