const STORAGE_KEY = 'referon_use_demo_cache'

function readStored() {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === null) return true
  return stored === 'true'
}

let enabled = readStored()
const listeners = new Set()

export function isDemoCacheEnabled() {
  return enabled
}

export function setDemoCacheEnabled(value) {
  enabled = Boolean(value)
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
  }
  listeners.forEach((listener) => listener(enabled))
}

export function subscribeDemoCache(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function readDemoCacheEnabledFromStorage() {
  return readStored()
}
