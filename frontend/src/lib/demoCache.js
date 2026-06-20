import { buildStaticDemoCache } from '../fixtures/demoResponseCache'

const STORAGE_KEY = 'referon_demo_response_cache'

let staticCache = null

function loadStaticCache() {
  if (!staticCache) staticCache = buildStaticDemoCache()
  return staticCache
}

function readOverlay() {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeOverlay(overlay) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay))
}

export function getDemoCache(bucket, key) {
  const overlay = readOverlay()
  if (overlay[bucket]?.[key] != null) return overlay[bucket][key]
  return loadStaticCache()[bucket]?.[key] ?? null
}

export function setDemoCache(bucket, key, value) {
  const overlay = readOverlay()
  if (!overlay[bucket]) overlay[bucket] = {}
  overlay[bucket][key] = value
  writeOverlay(overlay)
}

export function clearDemoCacheOverlay() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
