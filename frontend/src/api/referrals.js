import { chartEntries } from '../fixtures/chartEntries'
import { SEEDED_PREDICTIONS } from '../fixtures/seededPredictions'
import { isDemoCacheEnabled } from '../lib/demoCacheMode'
import { getDemoCache, setDemoCache } from '../lib/demoCache'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

async function apiFetch(path, options) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request failed (${res.status})`)
  }
  return res.json()
}

function capitalizeUrgency(urgency) {
  if (!urgency) return 'Routine'
  return urgency.charAt(0).toUpperCase() + urgency.slice(1).toLowerCase()
}

export function mapBackendDraft(referral) {
  const draft = referral.draft ?? {}
  return {
    reason: draft.reason ?? '',
    specialty: referral.specialty ?? '',
    urgency: capitalizeUrgency(referral.urgency),
    relevantHistory: draft.history ?? '',
    medications: draft.medications ?? '',
    allergies: draft.allergies ?? '',
    investigations: draft.investigations ?? '',
    additionalNotes: draft.notes ?? '',
  }
}

export function mapBackendPrediction(referral, chartEntriesList) {
  const pred = referral.latestPrediction
  if (!pred) {
    throw new Error('Backend did not return an AI prediction')
  }

  const byId = Object.fromEntries(chartEntriesList.map((e) => [e.id, e]))
  const warnings = [...new Set(pred.warnings ?? [])]
  if (pred.isFallback && !warnings.some((w) => /fallback|unavailable/i.test(w))) {
    warnings.push('Live AI was unavailable — showing fallback prediction')
  }

  return {
    specialty: pred.specialty,
    confidence: pred.confidence,
    rationale: pred.rationale,
    sourceRefs: (pred.sourceChartEntryIds ?? []).map((id) => {
      const entry = byId[id]
      const label = entry
        ? `${new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${entry.title}`
        : id
      return { chartEntryId: id, label }
    }),
    warnings,
    isFallback: pred.isFallback,
    modelLabel: pred.modelLabel,
  }
}

function buildWarnings(patientId) {
  const entries = chartEntries.filter((e) => e.patientId === patientId)
  const meds = entries.filter((e) => e.type === 'medication')
  const warnings = []
  if (meds.length > 0) {
    const mostRecent = meds.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    const daysSince = (Date.now() - new Date(mostRecent.date).getTime()) / 86400000
    if (daysSince > 90) {
      warnings.push('Medication list has not been updated in 90+ days')
    }
  }
  return warnings
}

export async function predictSpecialty(patientId, chartEntriesList = []) {
  if (isDemoCacheEnabled()) {
    await delay(350)
    const cached = getDemoCache('predictSpecialty', patientId)
    if (cached) {
      const byId = Object.fromEntries(chartEntriesList.map((e) => [e.id, e]))
      const sourceRefs = (cached.prediction.sourceRefs ?? []).map((ref) => {
        const entry = byId[ref.chartEntryId]
        if (!entry) return ref
        return {
          chartEntryId: ref.chartEntryId,
          label: `${new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${entry.title}`,
        }
      })
      return {
        ...cached,
        prediction: { ...cached.prediction, sourceRefs },
      }
    }
  }

  if (MOCK) {
    await delay(600)
    const seed = SEEDED_PREDICTIONS[patientId]
    if (!seed) {
      return {
        referralId: null,
        prediction: {
          specialty: 'General Internal Medicine',
          confidence: 0.4,
          rationale: 'Insufficient chart history to confidently predict a subspecialty referral.',
          sourceRefs: [],
          warnings: ['Using demo data'],
        },
        draft: null,
      }
    }
    const entries = chartEntries.filter((e) => seed.sourceRefIds.includes(e.id))
    return {
      referralId: null,
      prediction: {
        specialty: seed.specialty,
        confidence: seed.confidence,
        rationale: seed.rationale,
        sourceRefs: entries.map((e) => ({
          chartEntryId: e.id,
          label: `${new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${e.title}`,
        })),
        warnings: buildWarnings(patientId),
      },
      draft: null,
    }
  }

  const referral = await apiFetch('/api/v1/referrals/from-chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId, chartWindowDays: 730 }),
  })

  const result = {
    referralId: referral.id,
    prediction: mapBackendPrediction(referral, chartEntriesList),
    draft: mapBackendDraft(referral),
  }
  setDemoCache('predictSpecialty', patientId, result)
  if (result.draft?.specialty) {
    setDemoCache('generateReferralDraft', `${patientId}:${result.draft.specialty}`, result.draft)
    setDemoCache('generateReferralDraft', `${result.referralId}:${result.draft.specialty}`, result.draft)
  }
  return result
}

export async function generateReferralDraft(referralId, specialty) {
  if (isDemoCacheEnabled()) {
    await delay(250)
    const byReferral = getDemoCache('generateReferralDraft', `${referralId}:${specialty}`)
    if (byReferral) return { ...byReferral, specialty }
    for (const patientId of Object.keys(SEEDED_PREDICTIONS)) {
      const hit = getDemoCache('generateReferralDraft', `${patientId}:${specialty}`)
      if (hit) return { ...hit, specialty }
    }
  }

  if (MOCK) {
    await delay(500)
    const entries = chartEntries.filter((e) => e.patientId)
    const meds = entries.filter((e) => e.type === 'medication').map((e) => e.content).join(' ')
    const allergies = entries.filter((e) => e.type === 'allergy').map((e) => e.content).join(' ')
    const investigations = entries
      .filter((e) => e.type === 'imaging' || e.type === 'lab')
      .map((e) => `${e.title}: ${e.content}`)
      .join('\n')
    const visitNotes = entries.filter((e) => e.type === 'visit_note')
    const relevantHistory = visitNotes.map((e) => e.content).join(' ')

    return {
      reason: `Referral for evaluation related to ${specialty.toLowerCase()} findings.`,
      specialty,
      urgency: 'Routine',
      relevantHistory: relevantHistory || 'No relevant history on file.',
      medications: meds || 'No medications on file.',
      allergies: allergies || 'No known allergies on file.',
      investigations: investigations || 'No investigations on file.',
      additionalNotes: '',
    }
  }

  let referral = await apiFetch(`/api/v1/referrals/${referralId}`)
  if (referral.specialty !== specialty) {
    referral = await apiFetch(`/api/v1/referrals/${referralId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specialty }),
    })
  }
  const draft = mapBackendDraft(referral)
  setDemoCache('generateReferralDraft', `${referralId}:${specialty}`, draft)
  return draft
}

export async function previewReferral(referralId) {
  if (isDemoCacheEnabled()) {
    await delay(150)
    return { status: 'previewed' }
  }

  if (MOCK) {
    await delay(200)
    return { status: 'previewed' }
  }
  return apiFetch(`/api/v1/referrals/${referralId}/preview`, { method: 'POST' })
}

export async function sendReferral(referralId, specialistId) {
  if (isDemoCacheEnabled()) {
    await delay(400)
    return { status: 'sent', sentAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  }

  if (MOCK) {
    await delay(500)
    return { status: 'sent', sentAt: new Date().toISOString() }
  }

  let referral = await apiFetch(`/api/v1/referrals/${referralId}`)
  if (referral.status === 'draft') {
    referral = await previewReferral(referralId)
  }

  if (referral.status === 'previewed') {
    referral = await apiFetch(`/api/v1/referrals/${referralId}/select-specialist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specialistId }),
    })
  }

  return apiFetch(`/api/v1/referrals/${referralId}/send`, { method: 'POST' })
}

function patientInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('.')
    .toUpperCase()
}

export function mapPortalReferral(row) {
  return {
    id: row.id,
    patientId: row.patientId,
    patientInitials: patientInitials(row.patientName ?? 'Patient'),
    specialty: row.specialty ?? '',
    urgency: capitalizeUrgency(row.urgency),
    status: row.status,
    dateSent: row.updatedAt?.slice(0, 10) ?? '',
    specialistId: row.assignedSpecialistId,
    draft: {
      reason: row.reason ?? '',
      relevantHistory: row.history ?? '',
      medications: row.medications ?? '',
      allergies: row.allergies ?? '',
      investigations: row.investigations ?? '',
    },
    rejectionReason: null,
    infoRequest: null,
  }
}

export async function fetchSpecialistReferrals(specialistId) {
  if (MOCK) return null
  const rows = await apiFetch(
    `/api/v1/referrals?specialistId=${encodeURIComponent(specialistId)}`
  )
  return rows.map(mapPortalReferral)
}

export async function approveReferral(referralId) {
  if (MOCK) return { status: 'approved' }
  return apiFetch(`/api/v1/referrals/${referralId}/approve`, { method: 'POST' })
}

export async function rejectReferral(referralId, reason) {
  if (MOCK) return { status: 'rejected' }
  return apiFetch(`/api/v1/referrals/${referralId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
}
