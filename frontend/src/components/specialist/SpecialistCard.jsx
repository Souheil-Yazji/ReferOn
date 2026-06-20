import { MapPin, Calendar, Globe, CheckCircle2 } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

export default function SpecialistCard({ specialist, matchedCaseTypes = [], highlighted, onSelect, onMouseEnter, onMouseLeave }) {
  return (
    <Card
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-4 transition-shadow ${highlighted ? 'border-brand-500 shadow-md' : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold tracking-tight text-slate-900">{specialist.name}</p>
        <span className={`flex items-center gap-1 text-xs ${specialist.acceptingReferrals ? 'text-green-600' : 'text-slate-400'}`}>
          <span className={`h-2 w-2 rounded-full ${specialist.acceptingReferrals ? 'bg-green-500' : 'bg-slate-300'}`} />
          {specialist.acceptingReferrals ? 'Accepting' : 'Not accepting'}
        </span>
      </div>
      <p className="text-sm text-slate-600">{specialist.clinic}</p>
      <p className="text-xs text-slate-500">
        {specialist.specialty} · {specialist.subspecialty}
      </p>

      <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
        {specialist.distanceKm != null && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {specialist.distanceKm.toFixed(1)} km away
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Next: {new Date(specialist.nextAvailable).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {specialist.acceptedCaseTypes.map((type) => (
          <Badge key={type} variant={matchedCaseTypes.includes(type) ? 'blue' : 'default'}>
            {matchedCaseTypes.includes(type) ? '✓ ' : ''}
            {type}
          </Badge>
        ))}
      </div>

      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
        <Globe className="h-3 w-3" />
        {specialist.languages.join(', ')}
      </p>

      {specialist.matchesPreferences && (
        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-3 w-3" />
          Matches preferences
        </p>
      )}

      <div className="mt-3">
        <Button variant="primary" size="sm" onClick={() => onSelect?.(specialist)}>
          Select This Specialist
        </Button>
      </div>
    </Card>
  )
}
