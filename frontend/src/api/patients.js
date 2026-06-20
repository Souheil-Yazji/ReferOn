import { patients } from '../fixtures/patients'
import { chartEntries } from '../fixtures/chartEntries'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request failed (${res.status})`)
  }
  return res.json()
}

const DEMO_OHIP = {
  pat_001: '1234-567-890',
  pat_002: '9876-543-210',
  pat_003: '5566-778-899',
  pat_004: '3344-556-677',
}

function mapPatient(p) {
  return {
    id: p.id,
    name: p.name,
    dob: p.dob,
    ohip: p.ohip ?? DEMO_OHIP[p.id] ?? p.id.replace('pat_', '').toUpperCase(),
    location: {
      lat: p.lat,
      lng: p.lng,
      label: p.addressSummary ?? p.location?.label ?? 'Unknown',
    },
  }
}

const ENTRY_TYPE_MAP = {
  note: 'visit_note',
  diagnosis: 'visit_note',
}

function mapChartEntry(entry, patientId) {
  return {
    id: entry.id,
    patientId,
    date: entry.entryDate,
    type: ENTRY_TYPE_MAP[entry.entryType] ?? entry.entryType,
    title: entry.summary,
    content: entry.fullText,
    metadata: entry.metadata ?? null,
  }
}

function buildUploadPayload(entryType, file) {
  const sizeKb = Math.round(file.size / 1024)
  const title = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
  const label = entryType === 'lab' ? 'lab result' : 'imaging study'
  return {
    entryType,
    summary: title || file.name,
    fullText: `Uploaded ${label}: ${file.name} (${sizeKb} KB). Document attached for referral review.`,
    metadata: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    },
  }
}

async function apiPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.message || `Request failed (${res.status})`)
  }
  return res.json()
}

export async function searchPatients(query) {
  if (MOCK) {
    await delay(400)
    const q = query.trim().toLowerCase()
    if (!q) return patients
    return patients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.ohip.includes(q)
    )
  }
  const data = await apiFetch(`/api/v1/patients?q=${encodeURIComponent(query)}`)
  return data.map(mapPatient)
}

export async function getChartEntries(patientId) {
  if (MOCK) {
    await delay(400)
    return chartEntries
      .filter((e) => e.patientId === patientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }
  const data = await apiFetch(
    `/api/v1/patients/${patientId}/chart-entries?windowDays=730`
  )
  return (data.entries ?? [])
    .map((entry) => mapChartEntry(entry, patientId))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function uploadChartDocument(patientId, entryType, file) {
  const payload = buildUploadPayload(entryType, file)

  if (MOCK) {
    await delay(400)
    return {
      id: `chart_upload_${Date.now()}`,
      patientId,
      date: new Date().toISOString().slice(0, 10),
      type: entryType,
      title: payload.summary,
      content: payload.fullText,
      metadata: payload.metadata,
    }
  }

  const created = await apiPost(`/api/v1/patients/${patientId}/chart-entries`, payload)
  return mapChartEntry(created, patientId)
}
