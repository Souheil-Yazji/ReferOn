import FutureLabel from '../ui/FutureLabel'
import Button from '../ui/Button'
import ReferralStatusBadge from './ReferralStatusBadge'

export default function ReferralPreview({ patient, physicianName, specialist, draft, status, onSend, sending }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Referral Letter</p>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {draft.specialty} — {draft.urgency}
          </h2>
        </div>
        <ReferralStatusBadge status={status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
          <p className="text-slate-900">{patient.name}</p>
          <p className="text-xs text-slate-500">OHIP {patient.ohip} · DOB {patient.dob}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Referring Physician</p>
          <p className="text-slate-900">{physicianName}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Specialist</p>
        <p className="text-slate-900">{specialist.name} — {specialist.clinic}</p>
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-700">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Reason for referral</p>
          <p>{draft.reason}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Relevant history</p>
          <p>{draft.relevantHistory}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Medications</p>
          <p>{draft.medications}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Allergies</p>
          <p>{draft.allergies}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Investigations</p>
          <p>{draft.investigations}</p>
        </div>
        {draft.additionalNotes && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Additional notes</p>
            <p>{draft.additionalNotes}</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-start gap-2">
        <Button variant="primary" onClick={onSend} loading={sending} disabled={status === 'sent'}>
          {status === 'sent' ? 'Sent' : 'Send Referral'}
        </Button>
        <FutureLabel>Real fax/email submission coming in production</FutureLabel>
      </div>
    </div>
  )
}
