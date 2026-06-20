import { useState, useEffect, useMemo, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import ReferralStatusBadge from '../components/referral/ReferralStatusBadge'
import RejectionReasonModal from '../components/specialist/RejectionReasonModal'
import RequestInfoModal from '../components/specialist/RequestInfoModal'
import { useDemoContext } from '../context/useDemoContext'
import { useToast } from '../components/ui/useToast'
import { useTranslation } from '../i18n/useTranslation'
import { approveReferral, rejectReferral, fetchSpecialistReferrals } from '../api/referrals'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export default function SpecialistPortal() {
  const { specialists, referrals, updateReferralRecord } = useDemoContext()
  const showToast = useToast()
  const { t, translateSpecialty, translateUrgency } = useTranslation()
  const [selectedReferralId, setSelectedReferralId] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false)
  const [fetchedReferrals, setFetchedReferrals] = useState([])
  const [loadingInbox, setLoadingInbox] = useState(!MOCK)

  const loadInbox = useCallback(async () => {
    if (MOCK || specialists.length === 0) return
    setLoadingInbox(true)
    try {
      const rowsBySpecialist = await Promise.all(
        specialists.map((s) => fetchSpecialistReferrals(s.id).catch(() => []))
      )
      setFetchedReferrals(rowsBySpecialist.flat().filter(Boolean))
    } catch {
      showToast(t('toasts.loadReferralsFailed'))
      setFetchedReferrals([])
    } finally {
      setLoadingInbox(false)
    }
  }, [specialists, showToast, t])

  useEffect(() => {
    loadInbox()
  }, [loadInbox])

  const allReferrals = MOCK ? referrals : fetchedReferrals

  const groups = useMemo(() => {
    const bySpecialistId = new Map()
    for (const r of allReferrals) {
      if (!r.specialistId) continue
      if (!bySpecialistId.has(r.specialistId)) bySpecialistId.set(r.specialistId, [])
      bySpecialistId.get(r.specialistId).push(r)
    }
    return specialists
      .filter((s) => bySpecialistId.has(s.id))
      .map((s) => ({ specialist: s, referrals: bySpecialistId.get(s.id) }))
  }, [allReferrals, specialists])

  const selected = allReferrals.find((r) => r.id === selectedReferralId)

  function updateLocalReferral(referralId, patch) {
    updateReferralRecord(referralId, patch)
    setFetchedReferrals((prev) => prev.map((r) => (r.id === referralId ? { ...r, ...patch } : r)))
  }

  async function approve(referralId) {
    try {
      if (!MOCK) await approveReferral(referralId)
      updateLocalReferral(referralId, { status: 'approved' })
      showToast(t('toasts.approved'))
    } catch {
      showToast(t('toasts.approveFailed'))
    }
  }

  async function reject(reason) {
    try {
      if (!MOCK) await rejectReferral(selectedReferralId, reason)
      updateLocalReferral(selectedReferralId, { status: 'rejected', rejectionReason: reason })
      showToast(t('toasts.rejected'))
      setShowRejectModal(false)
    } catch {
      showToast(t('toasts.rejectFailed'))
    }
  }

  function requestMoreInfo(message) {
    updateLocalReferral(selectedReferralId, { status: 'more_info_requested', infoRequest: message })
    showToast(t('toasts.infoRequestSent'))
    setShowRequestInfoModal(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h2 className="mb-6 text-lg font-semibold tracking-tight text-slate-900">{t('portal.title')}</h2>

      {loadingInbox && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loadingInbox && groups.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">{t('portal.empty')}</p>
      )}

      <div className="space-y-6">
        {groups.map(({ specialist, referrals: specialistReferrals }) => (
          <div key={specialist.id}>
            <h3 className="mb-2 text-sm font-semibold tracking-tight text-slate-900">
              {specialist.name}
              {specialist.specialty && (
                <span className="ml-2 text-xs font-normal text-slate-500">
                  {translateSpecialty(specialist.specialty)}
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {specialistReferrals.map((r) => (
                <Card
                  key={r.id}
                  as="button"
                  onClick={() => setSelectedReferralId(r.id)}
                  className={`w-full p-4 text-left ${selectedReferralId === r.id ? 'border-brand-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {t('portal.patientHeader', { initials: r.patientInitials })}
                    </span>
                    <ReferralStatusBadge status={r.status} />
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span>{translateSpecialty(r.specialty)}</span>
                    <span>{translateUrgency(r.urgency)}</span>
                    <span>{r.dateSent}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <Card className="mt-6 p-6">
          <h3 className="text-base font-semibold tracking-tight text-slate-900">
            {t('portal.patientDetail', {
              initials: selected.patientInitials,
              specialty: translateSpecialty(selected.specialty),
            })}
          </h3>

          {selected.status === 'rejected' && selected.rejectionReason && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {selected.rejectionReason}
            </div>
          )}

          {selected.status === 'more_info_requested' && selected.infoRequest && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-orange-300 bg-orange-50 p-3 text-sm text-orange-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                  {t('portal.infoRequested')}
                </p>
                <p className="mt-1">{selected.infoRequest}</p>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('referral.reason')}</p>
              <p>{selected.draft.reason}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('referral.relevantHistory')}</p>
              <p>{selected.draft.relevantHistory}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('referral.medications')}</p>
              <p>{selected.draft.medications}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('referral.allergies')}</p>
              <p>{selected.draft.allergies}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{t('referral.investigations')}</p>
              <p>{selected.draft.investigations}</p>
            </div>
          </div>

          {(selected.status === 'pending' || selected.status === 'sent') && (
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => approve(selected.id)}>
                {t('shared.approve')}
              </Button>
              <Button variant="warning" onClick={() => setShowRequestInfoModal(true)}>
                {t('portal.requestMoreInfo')}
              </Button>
              <Button variant="danger" onClick={() => setShowRejectModal(true)}>
                {t('shared.reject')}
              </Button>
            </div>
          )}
        </Card>
      )}

      {showRejectModal && (
        <RejectionReasonModal onSubmit={reject} onClose={() => setShowRejectModal(false)} />
      )}

      {showRequestInfoModal && (
        <RequestInfoModal onSubmit={requestMoreInfo} onClose={() => setShowRequestInfoModal(false)} />
      )}
    </div>
  )
}
