import { createContext } from 'react'

export const AppSettingsContext = createContext(null)

export const LANG_STORAGE_KEY = 'referon_lang'
export const THEME_STORAGE_KEY = 'referon_theme'

export function readStoredLang() {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem(LANG_STORAGE_KEY)
  if (stored === 'fr') return 'fr'
  // migrate legacy register-only key
  const legacy = localStorage.getItem('referon_register_lang')
  if (legacy === 'fr') return 'fr'
  return 'en'
}

export function readStoredTheme() {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}
