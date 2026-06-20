import { useCallback, useEffect, useState } from 'react'
import {
  AppSettingsContext,
  LANG_STORAGE_KEY,
  THEME_STORAGE_KEY,
  readStoredLang,
  readStoredTheme,
} from './appSettingsStore'

export function AppSettingsProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang)
  const [theme, setThemeState] = useState(readStoredTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.lang = lang
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme, lang])

  const setLang = useCallback((next) => {
    setLangState(next)
    localStorage.setItem(LANG_STORAGE_KEY, next)
  }, [])

  const setTheme = useCallback((next) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <AppSettingsContext.Provider value={{ lang, setLang, theme, setTheme, toggleTheme }}>
      {children}
    </AppSettingsContext.Provider>
  )
}
