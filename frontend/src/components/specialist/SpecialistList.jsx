import SpecialistCard from './SpecialistCard'
import Spinner from '../ui/Spinner'
import { useTranslation } from '../../i18n/useTranslation'

export default function SpecialistList({
  specialists,
  status = 'done',
  matchedCaseTypes = [],
  highlightedId,
  favoriteIds = [],
  onToggleFavorite,
  onSelect,
  onHover,
}) {
  const { t } = useTranslation()

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        {t('specialist.loadError')}
      </div>
    )
  }

  if (!specialists || specialists.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{t('specialist.empty')}</p>
  }

  const ordered = [...specialists].sort((a, b) => {
    const aFav = favoriteIds.includes(a.id)
    const bFav = favoriteIds.includes(b.id)
    if (aFav !== bFav) return aFav ? -1 : 1
    return 0
  })

  return (
    <div className="space-y-3">
      {ordered.map((s) => (
        <SpecialistCard
          key={s.id}
          specialist={s}
          matchedCaseTypes={matchedCaseTypes}
          highlighted={highlightedId === s.id}
          favorited={favoriteIds.includes(s.id)}
          onToggleFavorite={onToggleFavorite}
          onSelect={onSelect}
          onMouseEnter={() => onHover?.(s.id)}
          onMouseLeave={() => onHover?.(null)}
        />
      ))}
    </div>
  )
}
