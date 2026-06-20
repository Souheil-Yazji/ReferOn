import { useEffect, useState, useTransition } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import StepIndicator from '../components/referral/StepIndicator'
import PatientSearch from '../components/patient/PatientSearch'
import PatientCard from '../components/patient/PatientCard'
import ChartSummary from '../components/patient/ChartSummary'
import SpecialtyPredictionCard from '../components/referral/SpecialtyPredictionCard'
import ReferralDraftForm from '../components/referral/ReferralDraftForm'
import PatientPreferencesForm from '../components/referral/PatientPreferencesForm'
import SpecialistList from '../components/specialist/SpecialistList'
import SpecialistMap from '../components/specialist/SpecialistMap'
import ReferralPreview from '../components/referral/ReferralPreview'
import { useDemoContext } from '../context/useDemoContext'
import { useToast } from '../components/ui/useToast'
import { getChartEntries } from '../api/patients'
import { predictSpecialty, generateReferralDraft, sendReferral } from '../api/referrals'
import { matchSpecialists } from '../api/specialists'
import { specialtyTaxonomy } from '../fixtures/specialtyTaxonomy'

const EMPTY_DRAFT = {
  reason: '',
  specialty: specialtyTaxonomy[0],
  urgency: 'Routine',
  relevantHistory: '',
  medications: '',
  allergies: '',
  investigations: '',
  additionalNotes: '',
}

const EMPTY_PREFERENCES = {
  maxDistanceKm: Infinity,
  preferredLanguage: '',
  preferredSpecialistIds: [],
  excludedSpecialistIds: [],
  timingNotes: '',
  otherNotes: '',
}

export default function PhysicianView() {
  const {
    selectedPatient,
    setSelectedPatient,
    currentStep,
    setCurrentStep,
    currentReferral,
    setCurrentReferral,
    addReferral,
  } = useDemoContext()
  const showToast = useToast()

  const [chartEntries, setChartEntries] = useState([])
  const [chartError, setChartError] = useState(false)
  const [isChartLoading, startChartTransition] = useTransition()
  const [predictionStatus, setPredictionStatus] = useState('done')
  const [draftStatus, setDraftStatus] = useState('done')
  const [matchStatus, setMatchStatus] = useState('done')
  const [hoveredSpecialistId, setHoveredSpecialistId] = useState(null)
  const [sending, setSending] = useState(false)

  const referral = currentReferral || {}
  const draft = referral.draft || EMPTY_DRAFT
  const preferences = referral.preferences || EMPTY_PREFERENCES

  function updateReferral(patch) {
    setCurrentReferral((prev) => ({ ...(prev || {}), ...patch }))
  }

  function transitionStatus(status, message) {
    updateReferral({ status })
    if (message) showToast(message)
  }

  function selectPatient(patient) {
    setSelectedPatient(patient)
    setCurrentReferral(null)
    setCurrentStep(2)
  }

  useEffect(() => {
    if (currentStep !== 2 || !selectedPatient) return
    let cancelled = false
    startChartTransition(async () => {
      try {
        const entries = await getChartEntries(selectedPatient.id)
        if (cancelled) return
        setChartEntries(entries)
        setChartError(false)
      } catch {
        if (!cancelled) setChartError(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [currentStep, selectedPatient, startChartTransition])

  const chartStatus = isChartLoading ? 'loading' : chartError ? 'error' : 'done'

  async function createReferralFromChart() {
    setPredictionStatus('loading')
    try {
      const prediction = await predictSpecialty(selectedPatient.id)
      updateReferral({ prediction, draft: { ...EMPTY_DRAFT, specialty: prediction.specialty }, status: 'draft' })
      setPredictionStatus('done')
      setCurrentStep(3)
    } catch {
      setPredictionStatus('error')
    }
  }

  function createManually() {
    updateReferral({ draft: EMPTY_DRAFT, status: 'draft' })
    setCurrentStep(4)
  }

  async function acceptPrediction(specialty) {
    setDraftStatus('loading')
    try {
      const generatedDraft = await generateReferralDraft(selectedPatient.id, specialty)
      updateReferral({ draft: generatedDraft, status: 'draft' })
      setDraftStatus('done')
      setCurrentStep(4)
    } catch {
      setDraftStatus('error')
    }
  }

  function overridePrediction(specialty) {
    acceptPrediction(specialty)
  }

  function goToPreferences() {
    transitionStatus('previewed', 'Referral draft saved')
    setCurrentStep(5)
  }

  async function findSpecialists() {
    setMatchStatus('loading')
    setCurrentStep(6)
    try {
      const results = await matchSpecialists({
        specialty: draft.specialty,
        patientLocation: selectedPatient.location,
        preferences,
      })
      updateReferral({ matchedSpecialists: results })
      setMatchStatus('done')
    } catch {
      setMatchStatus('error')
    }
  }

  function selectSpecialist(specialist) {
    transitionStatus('selected_specialist', `${specialist.name} selected`)
    updateReferral({ specialist })
    setCurrentStep(7)
  }

  async function handleSend() {
    setSending(true)
    transitionStatus('pending', 'Referral pending submission')
    try {
      const sent = await sendReferral({ ...referral, patientId: selectedPatient.id })
      await new Promise((r) => setTimeout(r, 800))
      transitionStatus('sent', 'Referral sent successfully')
      addReferral({
        id: `ref_${Date.now()}`,
        patientId: selectedPatient.id,
        patientInitials: selectedPatient.name
          .split(' ')
          .map((p) => p[0])
          .join('.')
          .toUpperCase(),
        specialty: draft.specialty,
        urgency: draft.urgency,
        status: 'sent',
        dateSent: sent.sentAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        specialistId: referral.specialist.id,
        draft,
        rejectionReason: null,
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <StepIndicator currentStep={currentStep} />
      </div>

      {currentStep === 1 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Select Patient</h2>
          <PatientSearch onSelect={selectPatient} />
        </Card>
      )}

      {currentStep === 2 && selectedPatient && (
        <Card className="p-6">
          <PatientCard patient={selectedPatient} />
          <h2 className="mb-3 mt-6 text-lg font-semibold tracking-tight text-slate-900">Review Chart</h2>
          {chartStatus === 'loading' && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}
          {chartStatus === 'error' && (
            <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              Couldn't load chart entries.{' '}
              <button onClick={() => setCurrentStep(2)} className="font-semibold underline">
                Try again
              </button>
            </div>
          )}
          {chartStatus === 'done' && <ChartSummary entries={chartEntries} />}

          <div className="mt-6 flex gap-3">
            <Button variant="primary" onClick={createReferralFromChart} loading={predictionStatus === 'loading'}>
              Create Referral from Chart
            </Button>
            <Button variant="secondary" onClick={createManually}>
              Create Manually
            </Button>
          </div>
          {predictionStatus === 'error' && (
            <p className="mt-2 text-sm text-red-600">AI prediction failed. Try again.</p>
          )}
        </Card>
      )}

      {currentStep === 3 && referral.prediction && (
        <SpecialtyPredictionCard
          prediction={referral.prediction}
          specialtyOptions={specialtyTaxonomy}
          onAccept={acceptPrediction}
          onOverride={overridePrediction}
        />
      )}
      {currentStep === 3 && draftStatus === 'loading' && (
        <div className="mt-4 flex justify-center">
          <Spinner />
        </div>
      )}

      {currentStep === 4 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Edit Referral Draft</h2>
          <ReferralDraftForm draft={draft} onChange={(d) => updateReferral({ draft: d })} onNext={goToPreferences} />
        </Card>
      )}

      {currentStep === 5 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Patient Preferences</h2>
          <PatientPreferencesForm
            preferences={preferences}
            onChange={(p) => updateReferral({ preferences: p })}
            onSubmit={findSpecialists}
          />
        </Card>
      )}

      {currentStep === 6 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">Match Specialist</h2>
          <div className="grid grid-cols-2 gap-6" style={{ minHeight: '480px' }}>
            <div className="overflow-y-auto pr-2" style={{ maxHeight: '600px' }}>
              <SpecialistList
                specialists={referral.matchedSpecialists}
                status={matchStatus}
                highlightedId={hoveredSpecialistId}
                onSelect={selectSpecialist}
                onHover={setHoveredSpecialistId}
              />
            </div>
            <div>
              <SpecialistMap
                patientLocation={selectedPatient?.location}
                specialists={referral.matchedSpecialists || []}
                highlightedId={hoveredSpecialistId}
                onMarkerHover={setHoveredSpecialistId}
              />
            </div>
          </div>
        </div>
      )}

      {currentStep === 7 && referral.specialist && (
        <ReferralPreview
          patient={selectedPatient}
          physicianName="Dr. Demo Physician"
          specialist={referral.specialist}
          draft={draft}
          status={referral.status}
          sending={sending}
          onSend={handleSend}
        />
      )}
    </div>
  )
}
