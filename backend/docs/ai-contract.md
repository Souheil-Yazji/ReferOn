# AI Service Contract

This document defines the HTTP contract the ReferOn backend expects from the AI service. The backend owns the schema; the AI service must implement a server at `AI_SERVICE_URL` (configured via environment variable, default `http://localhost:8000`).

## Endpoints

### `POST /v1/predict-specialty`

Called by the backend when a physician triggers AI-assisted referral creation or requests a re-prediction. The backend assembles the chart entries and prior rejection feedback; the AI service classifies the required specialty and drafts referral sections.

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

The backend applies a timeout of `AI_TIMEOUT_MS` (default 30 s) to every call. If the request times out or returns a non-200 response, the backend falls back to seeded demo predictions and appends `"AI service unavailable; using demo fallback."` to `warnings`. The manual referral path never calls the AI service.

## Rejection feedback

`rejectionFeedback` contains all prior rejection reasons for the same patient, sorted newest-first. The AI service should use these to improve the current draft — for example, by adding previously-missing items to the referral package or selecting a more appropriate specialty. The field will be an empty array if no prior rejections exist.

## Safety constraints

- Do not generate unsupported clinical assertions. Every clinical claim in `draftSections` must be traceable to a supplied `chartEntry`.
- Include the relevant `chartEntry.id` in `sourceChartEntryIds` for any entry that influenced the output.
- Do not set `specialty` to a diagnosis. The output is decision support for a reviewing physician, not an autonomous clinical decision.
- Keep generated text concise and editable. Physicians will review and edit before sending.
