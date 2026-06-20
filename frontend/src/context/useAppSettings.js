import { useContext } from 'react'
import { AppSettingsContext } from './appSettingsStore'

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider')
  return ctx
}
