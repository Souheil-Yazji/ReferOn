import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ReferralStatusBadge from '../components/referral/ReferralStatusBadge'
import RejectionReasonModal from '../components/specialist/RejectionReasonModal'
import { useDemoContext } from '../context/useDemoContext'
import { useToast } from '../components/ui/useToast'

export default function SpecialistPortal() {
  const { specialists, referrals, updateReferralRecord } = useDemoContext()
  const showToast = useToast()
  const [specialistId, setSpecialistId] = useState('spec_001')
  const [selectedReferralId, setSelectedReferralId] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const myReferrals = referrals.filter((r) => r.specialistId === specialistId)
  const selected = myReferrals.find((r) => r.id === selectedReferralId)

  function approve(referralId) {
    updateReferralRecord(referralId, { status: 'approved' })
    showToast('Referral approved')
  }

  function reject(reason) {
    updateReferralRecord(selectedReferralId, { status: 'rejected', rejectionReason: reason })
    showToast('Referral rejected')
    setShowRejectModal(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Specialist Portal</h2>
        <select
          value={specialistId}
          onChange={(e) => {
            setSpecialistId(e.target.value)
            setSelectedReferralId(null)
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {specialists.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {myReferrals.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">No referrals for this specialist yet.</p>
      )}

      <div className="space-y-2">
        {myReferrals.map((r) => (
          <Card
            key={r.id}
            as="button"
            onClick={() => setSelectedReferralId(r.id)}
            className={`w-full p-4 text-left ${selectedReferralId === r.id ? 'border-brand-500' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">Patient {r.patientInitials}</span>
              <ReferralStatusBadge status={r.status} />
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
              <span>{r.specialty}</span>
              <span>{r.urgency}</span>
              <span>{r.dateSent}</span>
            </div>
          </Card>
        ))}
      </div>

      {selected && (
        <Card className="mt-6 p-6">
          <h3 className="text-base font-semibold tracking-tight text-slate-900">
            Patient {selected.patientInitials} — {selected.specialty}
          </h3>

          {selected.status === 'rejected' && selected.rejectionReason && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {selected.rejectionReason}
            </div>
          )}

          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Reason for referral</p>
              <p>{selected.draft.reason}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Relevant history</p>
              <p>{selected.draft.relevantHistory}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Medications</p>
              <p>{selected.draft.medications}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Allergies</p>
              <p>{selected.draft.allergies}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Investigations</p>
              <p>{selected.draft.investigations}</p>
            </div>
          </div>

          {selected.status !== 'approved' && selected.status !== 'rejected' && (
            <div className="mt-5 flex gap-3">
              <Button variant="primary" onClick={() => approve(selected.id)}>
                Approve
              </Button>
              <Button variant="danger" onClick={() => setShowRejectModal(true)}>
                Reject
              </Button>
            </div>
          )}
        </Card>
      )}

      {showRejectModal && (
        <RejectionReasonModal onSubmit={reject} onClose={() => setShowRejectModal(false)} />
      )}
    </div>
  )
}
