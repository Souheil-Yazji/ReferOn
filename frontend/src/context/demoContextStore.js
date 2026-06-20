import { createContext } from 'react'
import { specialists as seedSpecialists } from '../fixtures/specialists'
import { seedReferrals } from '../fixtures/referrals'

export const DemoContext = createContext(null)

export const initialDemoState = {
  persona: 'physician',
  selectedPatient: null,
  currentReferral: null,
  currentStep: 1,
  specialists: seedSpecialists,
  referrals: seedReferrals,
  favoriteSpecialistIds: [],
}
