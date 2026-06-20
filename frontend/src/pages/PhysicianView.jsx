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
import AIReferralProcessingModal from '../components/referral/AIReferralProcessingModal'
import { useDemoContext } from '../context/useDemoContext'
import { useToast } from '../components/ui/useToast'
import { getChartEntries, uploadChartDocument } from '../api/patients'
import { predictSpecialty, generateReferralDraft, previewReferral, sendReferral } from '../api/referrals'
import { matchSpecialists } from '../api/specialists'
import { specialtyTaxonomy } from '../fixtures/specialtyTaxonomy'
import { useTranslation } from '../i18n/useTranslation'

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
  gender: '',
  otherNotes: '',
}

const MIN_AI_MODAL_MS = 8000

export default function PhysicianView() {
  const {
    selectedPatient,
    setSelectedPatient,
    currentStep,
    setCurrentStep,
    currentReferral,
    setCurrentReferral,
    addReferral,
    favoriteSpecialistIds,
    toggleFavoriteSpecialist,
  } = useDemoContext()
  const showToast = useToast()
  const { t } = useTranslation()

  const [chartEntries, setChartEntries] = useState([])
  const [chartError, setChartError] = useState(false)
  const [isChartLoading, startChartTransition] = useTransition()
  const [predictionStatus, setPredictionStatus] = useState('done')
  const [draftStatus, setDraftStatus] = useState('done')
  const [matchStatus, setMatchStatus] = useState('done')
  const [hoveredSpecialistId, setHoveredSpecialistId] = useState(null)
  const [sending, setSending] = useState(false)
  const [uploadingType, setUploadingType] = useState(null)

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

  async function handleChartUpload(entryType, file) {
    if (!selectedPatient) return
    setUploadingType(entryType)
    try {
      const entry = await uploadChartDocument(selectedPatient.id, entryType, file)
      setChartEntries((prev) =>
        [entry, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date))
      )
      showToast(
        entryType === 'lab' ? t('toasts.labUploaded') : t('toasts.imagingUploaded')
      )
    } catch {
      showToast(t('toasts.uploadFailed'))
    } finally {
      setUploadingType(null)
    }
  }

  async function createReferralFromChart() {
    setPredictionStatus('loading')
    const startedAt = Date.now()
    try {
      const result = await predictSpecialty(selectedPatient.id, chartEntries)
      const remaining = MIN_AI_MODAL_MS - (Date.now() - startedAt)
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining))

      updateReferral({
        id: result.referralId,
        prediction: result.prediction,
        draft: result.draft ?? { ...EMPTY_DRAFT, specialty: result.prediction.specialty },
        status: 'draft',
      })
      setPredictionStatus('done')
      setCurrentStep(3)
    } catch {
      setPredictionStatus('error')
    }
  }

  async function acceptPrediction(specialty) {
    setDraftStatus('loading')
    try {
      const generatedDraft = referral.id
        ? await generateReferralDraft(referral.id, specialty)
        : { ...EMPTY_DRAFT, specialty }
      updateReferral({ draft: generatedDraft, status: 'draft' })
      setDraftStatus('done')
      setCurrentStep(4)
    } catch {
      setDraftStatus('error')
    }
  }

  async function goToPreferences() {
    try {
      if (referral.id) await previewReferral(referral.id)
      transitionStatus('previewed', t('toasts.draftSaved'))
      setCurrentStep(5)
    } catch {
      showToast(t('toasts.previewFailed'))
    }
  }

  async function findSpecialists() {
    setMatchStatus('loading')
    setCurrentStep(6)
    try {
      const results = await matchSpecialists({
        referralId: referral.id,
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
    transitionStatus('selected_specialist', t('toasts.specialistSelected', { name: specialist.name }))
    updateReferral({ specialist })
    setCurrentStep(7)
  }

  async function handleSend() {
    setSending(true)
    transitionStatus('pending', t('toasts.pendingSubmission'))
    try {
      const sent = await sendReferral(referral.id, referral.specialist.id)
      await new Promise((r) => setTimeout(r, 800))
      transitionStatus('sent', t('toasts.sentSuccess'))
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        addReferral({
          id: referral.id,
          patientId: selectedPatient.id,
          patientInitials: selectedPatient.name
            .split(' ')
            .map((p) => p[0])
            .join('.')
            .toUpperCase(),
          specialty: draft.specialty,
          urgency: draft.urgency,
          status: sent.status ?? 'sent',
          dateSent: sent.updatedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          specialistId: referral.specialist.id,
          draft,
          rejectionReason: null,
        })
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />
      </div>

      {currentStep > 1 && (
        <button
          type="button"
          onClick={() => setCurrentStep(currentStep - 1)}
          className="mb-4 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          {t('shared.back')}
        </button>
      )}

      {currentStep === 1 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">{t('physician.selectPatient')}</h2>
          <PatientSearch onSelect={selectPatient} />
        </Card>
      )}

      {currentStep === 2 && selectedPatient && (
        <Card className="p-6">
          <PatientCard patient={selectedPatient} />
          <h2 className="mb-3 mt-6 text-lg font-semibold tracking-tight text-slate-900">{t('physician.reviewChart')}</h2>
          {chartStatus === 'loading' && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}
          {chartStatus === 'error' && (
            <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              {t('physician.chartLoadError')}{' '}
              <button onClick={() => setCurrentStep(2)} className="font-semibold underline">
                {t('shared.tryAgain')}
              </button>
            </div>
          )}
          {chartStatus === 'done' && (
            <ChartSummary
              entries={chartEntries}
              onUpload={handleChartUpload}
              uploadingType={uploadingType}
            />
          )}

          <div className="mt-6 flex gap-3">
            <Button
              variant="primary"
              onClick={createReferralFromChart}
              disabled={predictionStatus === 'loading'}
            >
              {t('physician.createReferral')}
            </Button>
          </div>
          {predictionStatus === 'loading' && <AIReferralProcessingModal />}
          {predictionStatus === 'error' && (
            <p className="mt-2 text-sm text-red-600">{t('physician.predictionError')}</p>
          )}
        </Card>
      )}

      {currentStep === 3 && referral.prediction && (
        <SpecialtyPredictionCard
          prediction={referral.prediction}
          chartEntries={chartEntries}
          onAccept={acceptPrediction}
        />
      )}
      {currentStep === 3 && draftStatus === 'loading' && (
        <div className="mt-4 flex justify-center">
          <Spinner />
        </div>
      )}

      {currentStep === 4 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">{t('physician.editDraft')}</h2>
          <ReferralDraftForm draft={draft} onChange={(d) => updateReferral({ draft: d })} onNext={goToPreferences} />
        </Card>
      )}

      {currentStep === 5 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">{t('physician.patientPreferences')}</h2>
          <PatientPreferencesForm
            preferences={preferences}
            onChange={(p) => updateReferral({ preferences: p })}
            onSubmit={findSpecialists}
          />
        </Card>
      )}

      {currentStep === 6 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">{t('physician.matchSpecialist')}</h2>
          <div className="grid grid-cols-2 gap-6" style={{ minHeight: '480px' }}>
            <div className="overflow-y-auto pr-2" style={{ maxHeight: '600px' }}>
              <SpecialistList
                specialists={referral.matchedSpecialists}
                status={matchStatus}
                highlightedId={hoveredSpecialistId}
                favoriteIds={favoriteSpecialistIds}
                onToggleFavorite={toggleFavoriteSpecialist}
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
          physicianName={t('physician.demoPhysician')}
          specialist={referral.specialist}
          draft={draft}
          status={referral.status}
          onDraftChange={(d) => updateReferral({ draft: d })}
          sending={sending}
          onSend={handleSend}
        />
      )}
    </div>
  )
}
