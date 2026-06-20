/**
 * AI service contract owned by the ReferOn backend.
 * The AI teammate implements a service that satisfies these types at AI_SERVICE_URL.
 * See backend/docs/ai-contract.md for narrative documentation.
 */

export interface AiChartEntry {
  id: string;
  entryType: string;
  date: string;
  text: string;
  summary: string;
}

export interface AiRejectionFeedback {
  reason: string;
  specialty: string | null;
  createdAt: string;
}

export interface PredictSpecialtyRequest {
  patientId: string;
  chartEntries: AiChartEntry[];
  rejectionFeedback: AiRejectionFeedback[];
  additionalInstructions?: string;
}

export interface AiDraftSections {
  reason?: string;
  history?: string;
  medications?: string;
  allergies?: string;
  investigations?: string;
  notes?: string;
}

export interface PredictSpecialtyResponse {
  specialty: string;
  confidence: number; // 0–1
  rationale: string;
  sourceChartEntryIds: string[];
  warnings: string[];
  draftSections: AiDraftSections;
  modelLabel: string;
}
