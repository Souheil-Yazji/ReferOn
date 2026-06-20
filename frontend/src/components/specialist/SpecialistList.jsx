import SpecialistCard from './SpecialistCard'
import Spinner from '../ui/Spinner'

export default function SpecialistList({
  specialists,
  status = 'done',
  matchedCaseTypes = [],
  highlightedId,
  onSelect,
  onHover,
}) {
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
        Couldn't load matching specialists.
      </div>
    )
  }

  if (!specialists || specialists.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        No specialists found. Try widening the search distance.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {specialists.map((s) => (
        <SpecialistCard
          key={s.id}
          specialist={s}
          matchedCaseTypes={matchedCaseTypes}
          highlighted={highlightedId === s.id}
          onSelect={onSelect}
          onMouseEnter={() => onHover?.(s.id)}
          onMouseLeave={() => onHover?.(null)}
        />
      ))}
    </div>
  )
}
