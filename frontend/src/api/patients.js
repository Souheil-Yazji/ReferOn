import { patients } from '../fixtures/patients'
import { chartEntries } from '../fixtures/chartEntries'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export async function searchPatients(query) {
  if (MOCK) {
    await delay(400)
    const q = query.trim().toLowerCase()
    if (!q) return patients
    return patients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.ohip.includes(q)
    )
  }
  const res = await fetch(`${BASE}/api/v1/patients?q=${encodeURIComponent(query)}`)
  return res.json()
}

export async function getChartEntries(patientId) {
  if (MOCK) {
    await delay(400)
    return chartEntries
      .filter((e) => e.patientId === patientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }
  const res = await fetch(`${BASE}/api/v1/patients/${patientId}/chart-entries`)
  return res.json()
}
