import { MapPin } from 'lucide-react'
import Card from '../ui/Card'

export default function PatientCard({ patient, onClick, compact = false }) {
  return (
    <Card
      as={onClick ? 'button' : 'div'}
      onClick={onClick}
      className={`w-full p-4 text-left ${onClick ? 'cursor-pointer hover:border-brand-500 hover:shadow-md' : ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold tracking-tight text-slate-900">{patient.name}</p>
        {!compact && <span className="text-xs text-slate-500">DOB {patient.dob}</span>}
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
        <span>OHIP {patient.ohip}</span>
        {!compact && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {patient.location.label}
          </span>
        )}
      </div>
    </Card>
  )
}
