import { specialists } from '../fixtures/specialists'
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

function mapBackendMatch(match) {
  const s = match.specialist
  return {
    id: s.id,
    name: s.name,
    clinic: s.clinic,
    specialty: s.specialty,
    subspecialty: s.subspecialty ?? '',
    gender: s.gender ?? null,
    acceptingReferrals: s.acceptingReferrals,
    distanceKm: match.distanceKm,
    nextAvailable: match.nextAvailableAt ?? new Date().toISOString(),
    acceptedCaseTypes: s.caseTypes ?? [],
    languages: ['English'],
    location: match.location
      ? { lat: match.location.lat, lng: match.location.lng, label: match.location.label }
      : null,
    matchesPreferences: match.preferenceAlignment === 'preferred',
  }
}

function applyMatchPreferenceFilters(list, preferences, specialty) {
  return list
    .filter((s) => !specialty || s.specialty === specialty)
    .filter((s) => {
      if (!preferences.gender) return true
      return s.gender === preferences.gender
    })
    .filter((s) => {
      const maxDistance = preferences.maxDistanceKm ?? Infinity
      return s.distanceKm == null || s.distanceKm <= maxDistance
    })
}

function mapBackendSpecialist(row) {
  return {
    id: row.id,
    name: row.name,
    clinic: row.clinic,
    specialty: row.specialty,
    subspecialty: row.subspecialty ?? '',
    acceptingReferrals: row.acceptingReferrals ?? true,
    languages: ['English'],
  }
}

export async function fetchSpecialists() {
  if (MOCK) {
    await delay(200)
    return specialists
  }
  const rows = await apiFetch('/api/v1/specialists')
  return rows.map(mapBackendSpecialist)
}

function matchCacheKey(referralId, specialty, preferences = {}) {
  const gender = preferences.gender || 'any'
  return `${referralId}|${specialty}|${gender}`
}

export async function matchSpecialists({ referralId, specialty, patientLocation, preferences = {}, pool }) {
  if (isDemoCacheEnabled()) {
    await delay(300)
    const key = matchCacheKey(referralId, specialty, preferences)
    const cached =
      getDemoCache('matchSpecialists', key) ??
      getDemoCache('matchSpecialists', referralId) ??
      getDemoCache('matchSpecialists', `any:${specialty}`)
    if (cached) return applyMatchPreferenceFilters(cached, preferences, specialty)
  }

  if (MOCK) {
    await delay(400)
    const list = pool ?? specialists
    const maxDistance = preferences.maxDistanceKm ?? Infinity

    return list
      .filter((s) => s.specialty === specialty)
      .map((s) => {
        const distanceKm = patientLocation ? haversineKm(patientLocation, s.location) : null
        const matchesLanguage = preferences.preferredLanguage
          ? s.languages.some((l) => l.toLowerCase().includes(preferences.preferredLanguage.toLowerCase()))
          : false
        return {
          ...s,
          distanceKm,
          matchesPreferences: Boolean(matchesLanguage),
        }
      })
      .filter((s) => {
        if (!preferences.gender) return true
        return s.gender === preferences.gender
      })
      .filter((s) => s.distanceKm == null || s.distanceKm <= maxDistance)
      .sort((a, b) => {
        if (a.matchesPreferences !== b.matchesPreferences) return a.matchesPreferences ? -1 : 1
        return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
      })
  }

  if (!referralId) {
    throw new Error('referralId is required for specialist matching')
  }

  await apiFetch(`/api/v1/referrals/${referralId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preferences: {
        maxDistanceKm:
          preferences.maxDistanceKm != null && preferences.maxDistanceKm !== Infinity
            ? preferences.maxDistanceKm
            : null,
        language: preferences.preferredLanguage || undefined,
        gender: preferences.gender || undefined,
        otherNotes: preferences.otherNotes || undefined,
      },
    }),
  })

  const data = await apiFetch(`/api/v1/referrals/${referralId}/specialist-matches`)
  const matches = (data.matches ?? []).map(mapBackendMatch)
  const key = matchCacheKey(referralId, specialty, preferences)
  setDemoCache('matchSpecialists', key, matches)
  setDemoCache('matchSpecialists', referralId, matches)
  setDemoCache('matchSpecialists', `any:${specialty}`, matches)
  return matches
}

export async function registerSpecialist(specialist) {
  if (MOCK) {
    await delay(400)
    return { ...specialist, id: `spec_${Math.random().toString(36).slice(2, 8)}` }
  }

  const payload = {
    name: specialist.name,
    clinic: specialist.clinic,
    specialty: specialist.specialty,
    subspecialty: specialist.subspecialty || undefined,
    gender: specialist.gender || undefined,
    contactEmail: specialist.contactEmail,
    caseTypes: specialist.acceptedCaseTypes ?? specialist.caseTypes,
    acceptingReferrals: specialist.acceptingReferrals,
    locations: specialist.locations ?? (specialist.location
      ? [{
          lat: specialist.location.lat,
          lng: specialist.location.lng,
          label: specialist.location.label,
        }]
      : undefined),
    availability: specialist.availability ?? (specialist.nextAvailable
      ? { nextAvailableAt: `${specialist.nextAvailable}T09:00:00.000Z` }
      : undefined),
  }

  return apiFetch('/api/v1/specialists/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
