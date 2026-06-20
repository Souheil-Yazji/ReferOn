import { chartEntries } from '../fixtures/chartEntries'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

// Demo-only mapping from patient to a seeded specialty prediction, since
// there's no real model behind this POC. Real integration point: a backend
// AI service that classifies specialty from chart entries.
const SEEDED_PREDICTIONS = {
  pat_001: {
    specialty: 'Orthopedic Surgery',
    confidence: 0.82,
    rationale:
      'Recent chart entries show persistent right knee pain, failed conservative management over 6 months, and abnormal MRI findings. These findings align with orthopedic surgical evaluation criteria.',
    sourceRefIds: ['chart_001', 'chart_002'],
  },
  pat_002: {
    specialty: 'Cardiology',
    confidence: 0.74,
    rationale:
      'Exertional chest discomfort, dyslipidemia on recent labs, and nonspecific ECG ST changes warrant cardiology risk assessment.',
    sourceRefIds: ['chart_010', 'chart_011', 'chart_012'],
  },
  pat_003: {
    specialty: 'Dermatology',
    confidence: 0.88,
    rationale:
      'Documented irregular borders and color change in a shoulder mole meeting partial ABCDE criteria indicate need for dermatologic evaluation to rule out malignancy.',
    sourceRefIds: ['chart_020', 'chart_021'],
  },
  pat_004: {
    specialty: 'Gastroenterology',
    confidence: 0.61,
    rationale:
      'Chronic epigastric pain with only partial response to PPI therapy and negative H. pylori testing suggests need for endoscopic evaluation.',
    sourceRefIds: ['chart_030', 'chart_031'],
  },
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

export async function predictSpecialty(patientId) {
  if (MOCK) {
    await delay(600)
    const seed = SEEDED_PREDICTIONS[patientId]
    if (!seed) {
      return {
        specialty: 'General Internal Medicine',
        confidence: 0.4,
        rationale: 'Insufficient chart history to confidently predict a subspecialty referral.',
        sourceRefs: [],
        warnings: ['Using demo data'],
      }
    }
    const entries = chartEntries.filter((e) => seed.sourceRefIds.includes(e.id))
    return {
      specialty: seed.specialty,
      confidence: seed.confidence,
      rationale: seed.rationale,
      sourceRefs: entries.map((e) => ({
        chartEntryId: e.id,
        label: `${new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${e.title}`,
      })),
      warnings: buildWarnings(patientId),
    }
  }
  const res = await fetch(`${BASE}/api/v1/referrals/predict-specialty`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId }),
  })
  return res.json()
}

export async function generateReferralDraft(patientId, specialty) {
  if (MOCK) {
    await delay(500)
    const entries = chartEntries.filter((e) => e.patientId === patientId)
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
  const res = await fetch(`${BASE}/api/v1/referrals/generate-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId, specialty }),
  })
  return res.json()
}

export async function sendReferral(referral) {
  if (MOCK) {
    await delay(500)
    return { ...referral, status: 'sent', sentAt: new Date().toISOString() }
  }
  const res = await fetch(`${BASE}/api/v1/referrals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(referral),
  })
  return res.json()
}
