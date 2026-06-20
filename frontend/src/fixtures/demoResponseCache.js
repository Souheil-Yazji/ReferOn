import { chartEntries } from './chartEntries'
import { specialists } from './specialists'
import { SEEDED_PREDICTIONS } from './seededPredictions'

const DEMO_REFERRAL_IDS = {
  pat_001: 'ref_demo_001',
  pat_002: 'ref_demo_002',
  pat_003: 'ref_demo_003',
  pat_004: 'ref_demo_004',
}

function formatSourceRef(entry) {
  return {
    chartEntryId: entry.id,
    label: `${new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${entry.title}`,
  }
}

function buildWarnings(patientId) {
  const meds = chartEntries.filter((e) => e.patientId === patientId && e.type === 'medication')
  if (meds.length === 0) return []
  const mostRecent = meds.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  const daysSince = (Date.now() - new Date(mostRecent.date).getTime()) / 86400000
  if (daysSince > 90) return ['Medication list has not been updated in 90+ days']
  return []
}

function buildDraft(patientId, specialty) {
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
    reason: `Referral for ${specialty.toLowerCase()} evaluation based on recent chart findings.`,
    specialty,
    urgency: 'Routine',
    relevantHistory: relevantHistory || 'No relevant history on file.',
    medications: meds || 'No medications on file.',
    allergies: allergies || 'No known allergies on file.',
    investigations: investigations || 'No investigations on file.',
    additionalNotes: '',
  }
}

function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function buildMatches(patientId, specialty) {
  const locations = {
    pat_001: { lat: 43.6532, lng: -79.3832 },
    pat_002: { lat: 45.4215, lng: -75.6972 },
    pat_003: { lat: 43.4516, lng: -80.4925 },
    pat_004: { lat: 44.2312, lng: -76.486 },
  }
  const loc = locations[patientId]

  return specialists
    .map((s) => ({
      ...s,
      distanceKm: loc ? Math.round(haversineKm(loc, s.location) * 10) / 10 : null,
      matchesPreferences: false,
    }))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
}

function buildPredictSpecialty(patientId) {
  const seed = SEEDED_PREDICTIONS[patientId]
  if (!seed) return null

  const entries = chartEntries.filter((e) => seed.sourceRefIds.includes(e.id))
  const draft = buildDraft(patientId, seed.specialty)

  return {
    referralId: DEMO_REFERRAL_IDS[patientId] ?? `ref_demo_${patientId}`,
    prediction: {
      specialty: seed.specialty,
      confidence: seed.confidence,
      rationale: seed.rationale,
      sourceRefs: entries.map(formatSourceRef),
      warnings: [...buildWarnings(patientId), 'Using cached demo response'],
      isFallback: false,
      modelLabel: 'demo-cache',
    },
    draft,
  }
}

export function buildStaticDemoCache() {
  const predictSpecialty = {}
  const generateReferralDraft = {}
  const matchSpecialists = {}

  for (const patientId of Object.keys(SEEDED_PREDICTIONS)) {
    const predicted = buildPredictSpecialty(patientId)
    if (!predicted) continue

    predictSpecialty[patientId] = predicted
    generateReferralDraft[`${patientId}:${predicted.prediction.specialty}`] = predicted.draft
    generateReferralDraft[`${predicted.referralId}:${predicted.prediction.specialty}`] = predicted.draft
    matchSpecialists[`${patientId}:${predicted.prediction.specialty}`] = buildMatches(
      patientId,
      predicted.prediction.specialty
    )
    matchSpecialists[predicted.referralId] = buildMatches(patientId, predicted.prediction.specialty)
    matchSpecialists[`any:${predicted.prediction.specialty}`] = buildMatches(
      patientId,
      predicted.prediction.specialty
    )
  }

  return { predictSpecialty, generateReferralDraft, matchSpecialists }
}
