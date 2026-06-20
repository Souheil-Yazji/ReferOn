import { specialists } from '../fixtures/specialists'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

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

export async function matchSpecialists({ specialty, patientLocation, preferences = {}, pool }) {
  if (MOCK) {
    await delay(400)
    const list = pool ?? specialists
    const maxDistance = preferences.maxDistanceKm ?? Infinity

    return list
      .filter((s) => s.specialty === specialty)
      .map((s) => {
        const distanceKm = patientLocation ? haversineKm(patientLocation, s.location) : null
        const matchesPreferred = preferences.preferredSpecialistIds?.includes(s.id)
        const matchesExcluded = preferences.excludedSpecialistIds?.includes(s.id)
        const matchesLanguage = preferences.preferredLanguage
          ? s.languages.some((l) => l.toLowerCase().includes(preferences.preferredLanguage.toLowerCase()))
          : false
        return {
          ...s,
          distanceKm,
          matchesPreferences: Boolean(matchesPreferred || matchesLanguage),
          excludedByPreference: Boolean(matchesExcluded),
        }
      })
      .filter((s) => !s.excludedByPreference)
      .filter((s) => s.distanceKm == null || s.distanceKm <= maxDistance)
      .sort((a, b) => {
        if (a.matchesPreferences !== b.matchesPreferences) return a.matchesPreferences ? -1 : 1
        return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
      })
  }
  const res = await fetch(`${BASE}/api/v1/specialists/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ specialty, patientLocation, preferences }),
  })
  return res.json()
}

export async function registerSpecialist(specialist) {
  if (MOCK) {
    await delay(400)
    return { ...specialist, id: `spec_${Math.random().toString(36).slice(2, 8)}` }
  }
  const res = await fetch(`${BASE}/api/v1/specialists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(specialist),
  })
  return res.json()
}
