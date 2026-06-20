import { useContext } from 'react'
import { DemoContext } from './demoContextStore'

export function useDemoContext() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemoContext must be used within a DemoProvider')
  return ctx
}
