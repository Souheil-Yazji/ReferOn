# AI Service Contract

This document defines the AI contract owned by the ReferOn backend. In the POC, the backend can call OpenAI directly when `OPENAI_API_KEY` is configured, or fall back to the legacy local AI service at `AI_SERVICE_URL` when no OpenAI key is present. In both cases, the backend persists the same `PredictSpecialtyResponse` shape.

## Endpoints

### Backend OpenAI call

Called by the backend when a physician triggers AI-assisted referral creation or requests a re-prediction. The backend assembles chart entries and prior rejection feedback, builds the prompt, calls the OpenAI Responses API with strict structured JSON output, validates the result, and stores the parsed referral analysis.

Runtime settings:

- `OPENAI_API_KEY`: server-side key used by the backend only.
- `OPENAI_REFERRAL_MODEL`: model used for referral generation, default `gpt-5.5`.
- `OPENAI_BASE_URL`: OpenAI API base URL, default `https://api.openai.com/v1`.
- `AI_TIMEOUT_MS`: timeout applied to the OpenAI request.

### Legacy local AI service: `POST /v1/predict-specialty`

If `OPENAI_API_KEY` is not configured, the backend can call a local service at `AI_SERVICE_URL`. The local service must satisfy the same request and response contract. The backend assembles the chart entries and prior rejection feedback; the AI service classifies the required specialty and drafts referral sections.

**Request body:**

```json
{
  "patientId": "pat_ortho_001",
  "chartEntries": [
    {
      "id": "chart_orth_001",
      "entryType": "note",
      "date": "2026-04-20",
      "text": "Full chart note text...",
      "summary": "Short one-line summary of the entry"
    }
  ],
  "rejectionFeedback": [
    {
      "reason": "Missing recent imaging required for orthopaedic intake.",
      "specialty": "Orthopedic Surgery",
      "createdAt": "2026-05-10T14:30:00Z"
    }
  ],
  "additionalInstructions": "Consider recent knee imaging and persistent pain notes."
}
```

**Required fields:** `patientId`, `chartEntries`

**Optional:** `rejectionFeedback` (empty array if none), `additionalInstructions`

**Response body (HTTP 200):**

```json
{
  "specialty": "Orthopedic Surgery",
  "confidence": 0.82,
  "rationale": "Chart entries document 8 months of progressive knee pain, failed conservative management, and MRI findings of medial compartment osteoarthritis.",
  "sourceChartEntryIds": ["chart_orth_001", "chart_orth_002"],
  "warnings": [
    "Medication list has not been updated in over 90 days."
  ],
  "draftSections": {
    "reason": "Referral for assessment and management of progressive knee OA with failed conservative treatment.",
    "history": "8-month history of bilateral knee pain...",
    "medications": "Naproxen 500 mg BID, Acetaminophen 1 g TID PRN",
    "allergies": "Penicillin (rash)",
    "investigations": "MRI Left Knee (2026-04-10): Medial compartment OA, moderate joint space narrowing.",
    "notes": "Patient prefers surgical consultation."
  },
  "modelLabel": "referon-poc-v1"
}
```

**Required response fields:** `specialty`, `confidence`, `rationale`, `sourceChartEntryIds`, `warnings`, `draftSections`, `modelLabel`

**`draftSections`** fields are all optional strings. The backend will use whatever is populated; empty or missing sections are left for the physician to fill.

## Confidence thresholds

| Range | Label | Backend behaviour |
| --- | --- | --- |
| ≥ 0.80 | high | Pre-fill specialty, show rationale |
| 0.50 – 0.79 | medium | Pre-fill specialty, show caution note |
| < 0.50 | low | Leave specialty blank, require manual selection |

## Resilience

The backend applies a timeout of `AI_TIMEOUT_MS` (default 30 s) to every AI call. If OpenAI or the legacy local service times out, returns a non-200 response, or returns an invalid structured payload, the backend falls back to seeded demo predictions and appends `"AI service unavailable; using demo fallback."` to `warnings`. The manual referral path never calls the AI service.

## Rejection feedback

`rejectionFeedback` contains all prior rejection reasons for the same patient, sorted newest-first. The AI service should use these to improve the current draft — for example, by adding previously-missing items to the referral package or selecting a more appropriate specialty. The field will be an empty array if no prior rejections exist.

## Safety constraints

- Do not generate unsupported clinical assertions. Every clinical claim in `draftSections` must be traceable to a supplied `chartEntry`.
- Include the relevant `chartEntry.id` in `sourceChartEntryIds` for any entry that influenced the output.
- Do not set `specialty` to a diagnosis. The output is decision support for a reviewing physician, not an autonomous clinical decision.
- Keep generated text concise and editable. Physicians will review and edit before sending.
