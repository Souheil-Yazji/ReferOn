import { useState } from 'react'
import Button from '../ui/Button'

export default function RejectionReasonModal({ onSubmit, onClose }) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">Reject Referral</h3>
        <label className="mt-4 block">
          <span className="text-xs uppercase tracking-wide text-slate-500">Reason for rejection (required)</span>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" disabled={!reason.trim()} onClick={() => onSubmit(reason.trim())}>
            Submit Rejection
          </Button>
        </div>
      </div>
    </div>
  )
}
