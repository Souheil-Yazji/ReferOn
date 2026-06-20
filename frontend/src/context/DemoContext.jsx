import { useState, useCallback, useEffect } from 'react'
import { specialists as seedSpecialists } from '../fixtures/specialists'
import { seedReferrals } from '../fixtures/referrals'
import { fetchSpecialists } from '../api/specialists'
import { DemoContext, initialDemoState } from './demoContextStore'
import {
  readDemoCacheEnabledFromStorage,
  setDemoCacheEnabled,
  subscribeDemoCache,
} from '../lib/demoCacheMode'

export function DemoProvider({ children }) {
  const [state, setState] = useState(initialDemoState)
  const [demoCacheEnabled, setDemoCacheEnabledState] = useState(readDemoCacheEnabledFromStorage)

  useEffect(() => subscribeDemoCache(setDemoCacheEnabledState), [])

  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCK === 'true') return
    fetchSpecialists()
      .then((list) => {
        setState((s) => ({ ...s, specialists: list }))
      })
      .catch(() => {
        /* keep seed list as fallback */
      })
  }, [])

  const toggleDemoCache = useCallback(() => {
    setDemoCacheEnabled(!demoCacheEnabled)
  }, [demoCacheEnabled])

  const setPersona = useCallback((persona) => {
    setState((s) => ({ ...s, persona }))
  }, [])

  const setSelectedPatient = useCallback((selectedPatient) => {
    setState((s) => ({ ...s, selectedPatient }))
  }, [])

  const setCurrentStep = useCallback((currentStep) => {
    setState((s) => ({ ...s, currentStep }))
  }, [])

  const setCurrentReferral = useCallback((updater) => {
    setState((s) => ({
      ...s,
      currentReferral: typeof updater === 'function' ? updater(s.currentReferral) : updater,
    }))
  }, [])

  const addSpecialist = useCallback((specialist) => {
    setState((s) => ({ ...s, specialists: [...s.specialists, specialist] }))
  }, [])

  const addReferral = useCallback((referral) => {
    setState((s) => ({ ...s, referrals: [...s.referrals, referral] }))
  }, [])

  const toggleFavoriteSpecialist = useCallback((specialistId) => {
    setState((s) => ({
      ...s,
      favoriteSpecialistIds: s.favoriteSpecialistIds.includes(specialistId)
        ? s.favoriteSpecialistIds.filter((id) => id !== specialistId)
        : [...s.favoriteSpecialistIds, specialistId],
    }))
  }, [])

  const updateReferralRecord = useCallback((referralId, patch) => {
    setState((s) => ({
      ...s,
      referrals: s.referrals.map((r) => (r.id === referralId ? { ...r, ...patch } : r)),
    }))
  }, [])

  const resetDemo = useCallback(() => {
    setState({ ...initialDemoState, specialists: seedSpecialists, referrals: seedReferrals })
  }, [])

  const value = {
    ...state,
    demoCacheEnabled,
    toggleDemoCache,
    setPersona,
    setSelectedPatient,
    setCurrentStep,
    setCurrentReferral,
    addSpecialist,
    addReferral,
    updateReferralRecord,
    toggleFavoriteSpecialist,
    resetDemo,
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
