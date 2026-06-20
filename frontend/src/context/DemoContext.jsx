import { useState, useCallback } from 'react'
import { specialists as seedSpecialists } from '../fixtures/specialists'
import { seedReferrals } from '../fixtures/referrals'
import { DemoContext, initialDemoState } from './demoContextStore'

export function DemoProvider({ children }) {
  const [state, setState] = useState(initialDemoState)

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
    setPersona,
    setSelectedPatient,
    setCurrentStep,
    setCurrentReferral,
    addSpecialist,
    addReferral,
    updateReferralRecord,
    resetDemo,
  }

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
