import type { PredictSpecialtyResponse } from "./types.js";

/**
 * Seeded fallback AI responses keyed by scenario label.
 * The fallback for a given patient is chosen by matching known patient IDs (set
 * at seed time) or falling back to the generic "unknown" entry.
 *
 * This ensures the demo works reliably even when the AI service is down (NFR-012).
 */

const FALLBACKS: Record<string, PredictSpecialtyResponse> = {
  orthopedic: {
    specialty: "Orthopedic Surgery",
    confidence: 0.84,
    rationale:
      "Chart history shows persistent bilateral knee pain for 8 months with failed conservative management (physiotherapy, NSAIDs), MRI findings of medial compartment osteoarthritis, and functional decline. Orthopedic Surgery assessment is indicated.",
    sourceChartEntryIds: [],
    warnings: [],
    draftSections: {
      reason:
        "Referral for assessment and management of progressive bilateral knee osteoarthritis with failed conservative treatment.",
      history:
        "Patient presents with an 8-month history of bilateral knee pain, worse on the left, with morning stiffness lasting >30 minutes. Conservative management with physiotherapy and NSAIDs has not provided adequate relief. MRI (left knee) demonstrates medial compartment osteoarthritis with moderate joint space narrowing.",
      medications: "Naproxen 500 mg BID (current), Acetaminophen 1g TID PRN",
      allergies: "Penicillin (rash)",
      investigations:
        "MRI Left Knee (2026-04-10): Medial compartment osteoarthritis, moderate joint space narrowing. X-ray Both Knees (2026-03-01): Bilateral medial compartment narrowing.",
      notes:
        "Patient prefers surgical consultation. No prior knee surgeries. BMI 28.",
    },
    modelLabel: "referon-fallback-v1",
  },
  cardiology: {
    specialty: "Cardiology",
    confidence: 0.79,
    rationale:
      "Chart entries document exertional chest tightness, dyspnea on moderate exertion, and an abnormal ECG showing ST-segment changes. Cardiology assessment is required to rule out ischemic heart disease.",
    sourceChartEntryIds: [],
    warnings: [
      "Stress test results from 6 months ago may be stale. Consider ordering updated investigations before referral.",
    ],
    draftSections: {
      reason:
        "Referral for cardiology evaluation of exertional chest pain and ECG changes concerning for ischemic heart disease.",
      history:
        "Patient reports a 3-month history of exertional chest tightness and dyspnoea with moderate activity. ECG performed in office demonstrates non-specific ST-segment changes in leads II, III, aVF. Patient has a history of hypertension (controlled) and a 15 pack-year smoking history (quit 2019).",
      medications:
        "Ramipril 5 mg daily, Amlodipine 5 mg daily, Aspirin 81 mg daily",
      allergies: "None known",
      investigations:
        "ECG (2026-05-15): Non-specific ST changes leads II, III, aVF. Lipid panel (2026-02-10): LDL 3.8 mmol/L.",
      notes: "Urgent priority given ECG findings.",
    },
    modelLabel: "referon-fallback-v1",
  },
  ambiguous: {
    specialty: "Internal Medicine",
    confidence: 0.45,
    rationale:
      "Symptoms of fatigue, unintentional weight loss, and intermittent abdominal discomfort are non-specific. Internal Medicine is recommended for comprehensive workup. Consider GI or Oncology if initial workup reveals a focal finding.",
    sourceChartEntryIds: [],
    warnings: [
      "Confidence is below threshold (0.50). Manual specialty selection is recommended.",
      "CBC and metabolic panel results are absent from recent chart entries.",
    ],
    draftSections: {
      reason:
        "Referral for Internal Medicine workup of unexplained fatigue, weight loss, and abdominal discomfort.",
      history:
        "Patient reports 4-month history of fatigue, 5 kg unintentional weight loss, and intermittent right upper quadrant discomfort. No jaundice, haematemesis, or change in bowel habit reported.",
      medications: "Metformin 500 mg BID",
      allergies: "Sulfa drugs (urticaria)",
      investigations: "No recent bloodwork in chart.",
      notes:
        "Chart data is incomplete. Recent bloodwork recommended prior to referral.",
    },
    modelLabel: "referon-fallback-v1",
  },
  unknown: {
    specialty: "Internal Medicine",
    confidence: 0.3,
    rationale:
      "Insufficient chart data to make a confident specialty recommendation. Manual selection required.",
    sourceChartEntryIds: [],
    warnings: [
      "AI service unavailable; using demo fallback.",
      "Confidence is low. Manual specialty selection is required.",
    ],
    draftSections: {},
    modelLabel: "referon-fallback-v1",
  },
};

const PATIENT_SCENARIO_MAP: Record<string, keyof typeof FALLBACKS> = {};

/**
 * Register a patient ID → scenario mapping at seed time so the fallback
 * returns the right fixture for each seeded patient.
 */
export function registerPatientScenario(
  patientId: string,
  scenario: "orthopedic" | "cardiology" | "ambiguous"
) {
  PATIENT_SCENARIO_MAP[patientId] = scenario;
}

export function getFallbackPrediction(
  patientId: string,
  sourceChartEntryIds: string[]
): PredictSpecialtyResponse & { isFallback: true } {
  const scenario = PATIENT_SCENARIO_MAP[patientId] ?? "unknown";
  const base = FALLBACKS[scenario];
  return {
    ...base,
    sourceChartEntryIds:
      sourceChartEntryIds.length > 0 ? sourceChartEntryIds : base.sourceChartEntryIds,
    warnings: [
      "AI service unavailable; using demo fallback.",
      ...base.warnings,
    ],
    isFallback: true,
  };
}
