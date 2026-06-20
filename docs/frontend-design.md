# ReferOn Frontend Specification

Version: 0.1  
Status: Draft  
Last updated: 2026-06-20  
Owner: ReferOn frontend

---

## 1. Purpose

This document is the single source of truth for the ReferOn frontend. It is written for AI-assisted (vibe coding) development. Every screen, component, interaction, and style decision is specified here. The agent should build only what is in scope, mock anything that requires a real backend, and leave clear TODOs where real API integration is needed.

---

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| State | useState / useContext (no Redux) |
| Maps | Leaflet + react-leaflet |
| Icons | lucide-react |
| HTTP | fetch (no axios) |
| Mock data | Local JS fixture files |

---

## 3. Design Tokens

Define these as Tailwind theme extensions in `tailwind.config.js`.

```js
colors: {
  brand: {
    50:  '#f0f7ff',
    100: '#dbeafe',
    500: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a5f',
  },
  ai: {
    bg:     '#f0fdf4',  // green tint — AI-generated content backgrounds
    border: '#86efac',
    text:   '#166534',
  },
  warning: {
    bg:     '#fefce8',  // yellow tint — stale data, missing info warnings
    border: '#fde047',
    text:   '#854d0e',
  },
  status: {
    draft:              '#e2e8f0',
    previewed:          '#dbeafe',
    selected_specialist:'#ede9fe',
    pending:            '#fef9c3',
    sent:               '#dbeafe',
    approved:           '#dcfce7',
    rejected:           '#fee2e2',
  },
  future: '#f1f5f9',    // grey — future/deferred feature labels
}
```

### Typography

- Display / headings: `font-semibold`, `tracking-tight`
- Body: `text-sm text-slate-700`
- Labels / captions: `text-xs text-slate-500 uppercase tracking-wide`
- AI-generated text: wrapped in `AIGeneratedBlock` component (see Section 6)

---

## 4. File Structure

```
src/
├── main.jsx
├── App.jsx                  # Router root
├── index.css                # @import "tailwindcss"
│
├── pages/
│   ├── PhysicianView.jsx    # Main demo flow (step-by-step)
│   ├── SpecialistRegister.jsx
│   ├── SpecialistPortal.jsx # Specialist views referrals, approves/rejects
│   └── DemoReset.jsx        # One-click seed data reset
│
├── components/
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Badge.jsx
│   │   ├── Card.jsx
│   │   ├── Spinner.jsx
│   │   ├── FutureLabel.jsx      # "Coming in production" chip
│   │   └── AIGeneratedBlock.jsx # Wrapper for AI content
│   │
│   ├── patient/
│   │   ├── PatientSearch.jsx
│   │   ├── PatientCard.jsx
│   │   └── ChartSummary.jsx
│   │
│   ├── referral/
│   │   ├── ReferralDraftForm.jsx
│   │   ├── SpecialtyPredictionCard.jsx
│   │   ├── PatientPreferencesForm.jsx
│   │   ├── ReferralPreview.jsx
│   │   └── ReferralStatusBadge.jsx
│   │
│   └── specialist/
│       ├── SpecialistCard.jsx
│       ├── SpecialistMap.jsx
│       ├── SpecialistList.jsx
│       └── RejectionReasonModal.jsx
│
├── api/
│   ├── patients.js
│   ├── referrals.js
│   └── specialists.js
│
├── fixtures/
│   ├── patients.js
│   ├── chartEntries.js
│   └── specialists.js
│
└── context/
    └── DemoContext.jsx      # Active persona, selected patient, referral state
```

---

## 5. Routing

```jsx
// App.jsx
<Routes>
  <Route path="/"                    element={<PhysicianView />} />
  <Route path="/specialist/register" element={<SpecialistRegister />} />
  <Route path="/specialist/portal"   element={<SpecialistPortal />} />
  <Route path="/demo/reset"          element={<DemoReset />} />
</Routes>
```

A persistent top nav shows the active persona selector and a link to Demo Reset.

---

## 6. Shared UI Components

### `Button`
```jsx
// variants: primary | secondary | ghost | danger
// sizes: sm | md | lg
<Button variant="primary" size="md" onClick={fn} loading={bool}>
  Create Referral
</Button>
```
- Shows `<Spinner />` inline when `loading={true}` and disables click.

### `Badge`
```jsx
// variants: default | blue | green | yellow | red | purple
<Badge variant="green">Approved</Badge>
```

### `AIGeneratedBlock`
Wraps any AI-generated content. Renders a subtle green left border, a small "AI-assisted" label in the top-right corner, and the children content.
```jsx
<AIGeneratedBlock label="AI-generated · Orthopedic Surgery">
  <p>{referralDraft.summary}</p>
</AIGeneratedBlock>
```

### `FutureLabel`
Small grey chip for deferred features shown in the UI.
```jsx
<FutureLabel>Requires production auth</FutureLabel>
```

### `ReferralStatusBadge`
Maps referral status to a colored badge using the `status` color tokens.
```jsx
<ReferralStatusBadge status="rejected" /> // renders red badge "Rejected"
```

---

## 7. Fixture Data (Mock Backend)

Until the real API is ready, all data comes from `src/fixtures/`. The API layer (`src/api/`) should check for a `VITE_USE_MOCK=true` env var and return fixture data instead of fetching.

### `patients.js`
```js
export const patients = [
  {
    id: 'pat_001',
    name: 'Margaret Chen',
    dob: '1958-03-14',
    ohip: '1234-567-890',
    location: { lat: 43.6532, lng: -79.3832, label: 'Toronto, ON' },
  },
  {
    id: 'pat_002',
    name: 'David Okafor',
    dob: '1972-09-02',
    ohip: '9876-543-210',
    location: { lat: 45.4215, lng: -75.6972, label: 'Ottawa, ON' },
  },
  // add 1-2 more for demo variety
]
```

### `chartEntries.js`
Each entry maps to a `patientId`. Include 4-6 entries per patient covering: chief complaint, recent labs, imaging, medications, allergies, and visit notes.
```js
export const chartEntries = [
  {
    id: 'chart_001',
    patientId: 'pat_001',
    date: '2026-03-10',
    type: 'visit_note',
    title: 'Follow-up: Right knee pain',
    content: 'Patient reports persistent right knee pain for 6 months...',
  },
  // ...
]
```

### `specialists.js`
```js
export const specialists = [
  {
    id: 'spec_001',
    name: 'Dr. Aisha Patel',
    clinic: 'Toronto Orthopedic Centre',
    specialty: 'Orthopedic Surgery',
    subspecialty: 'Sports Medicine',
    acceptedCaseTypes: ['knee replacement', 'ACL repair', 'sports injury'],
    location: { lat: 43.6600, lng: -79.3900, label: 'Toronto, ON' },
    acceptingReferrals: true,
    nextAvailable: '2026-07-08',
    languages: ['English', 'Gujarati'],
  },
  // add 4-5 more across different specialties and cities
]
```

---

## 8. Pages

### 8.1 PhysicianView — Main Demo Flow

This is the primary demo screen. It is a **stepped single-page flow**, not multiple pages. Steps progress linearly with a visible step indicator at the top.

```
Step 1: Select Patient
Step 2: Review Chart
Step 3: AI Specialty Prediction
Step 4: Edit Referral Draft
Step 5: Patient Preferences
Step 6: Match Specialist
Step 7: Referral Preview & Send
```

**Step indicator** — horizontal row of numbered circles. Completed steps are filled brand-500, current step has a ring, future steps are grey.

#### Step 1 — Select Patient
- Search input (filters `patients` fixture by name or OHIP)
- Results as `<PatientCard />` rows
- Clicking a patient advances to Step 2

#### Step 2 — Review Chart
- Shows `<PatientCard />` summary at top
- `<ChartSummary />` renders chart entries grouped by type (visit notes, labs, imaging, medications, allergies)
- Each entry shows date, type badge, title, and expandable content
- "Create Referral from Chart" primary button at bottom → triggers AI call → advances to Step 3
- "Create Manually" secondary button → skips to Step 4 with empty draft

#### Step 3 — AI Specialty Prediction
- Full-width `<SpecialtyPredictionCard />` (see Section 9)
- "Accept & Continue" button → advances to Step 4 with predicted specialty pre-filled
- "Override Specialty" dropdown → lets physician pick different specialty, then continue

#### Step 4 — Edit Referral Draft
- `<ReferralDraftForm />` with fields:
  - Reason for referral (textarea)
  - Specialty (pre-filled, editable)
  - Urgency (select: Routine / Urgent / Emergent)
  - Relevant history (AI-generated, editable, wrapped in `<AIGeneratedBlock />`)
  - Medications (AI-generated, editable)
  - Allergies (AI-generated, editable)
  - Investigations (AI-generated, editable)
  - Additional notes (textarea)
- "Next: Patient Preferences" button at bottom

#### Step 5 — Patient Preferences
- `<PatientPreferencesForm />` with fields:
  - Max travel distance (select: 10km / 25km / 50km / Any)
  - Preferred language (optional text input)
  - Preferred specialists (multi-select from fixture list)
  - Excluded specialists (multi-select from fixture list)
  - Timing notes (textarea, e.g. "Patient works nights, prefers morning appointments")
  - Other notes (textarea)
- "Find Specialists" button → runs matching → advances to Step 6

#### Step 6 — Match Specialist
- Two-panel layout:
  - Left: `<SpecialistList />` — ranked cards with distance, next available, specialty fit badge, preference alignment indicator
  - Right: `<SpecialistMap />` — Leaflet map with specialist pins, patient location pin
- Clicking a specialist card highlights the map pin and vice versa
- "Select This Specialist" button on each card → advances to Step 7

#### Step 7 — Referral Preview & Send
- `<ReferralPreview />` — formatted referral letter preview (read-only)
- Shows: patient info, referring physician (demo persona), specialist selected, referral content
- "Send Referral" button → marks status as `sent` (simulated), shows success toast
- Status transitions to `pending` then `sent` with a brief animated delay for demo effect
- `<FutureLabel>Real fax/email submission coming in production</FutureLabel>` shown below button

---

### 8.2 SpecialistRegister

Simple self-registration form. On submit, adds specialist to the in-memory fixture store and shows a success confirmation.

Fields:
- Full name
- Clinic name
- Specialty (select from taxonomy list)
    heres my lsit: 
    Specialists/specialty clinics (use list from https://londonreferral.com/)
a. Abortion
b. Addictions
c. Allergy &amp; Immunology
d. Botox
e. Breast Care
f. Body Maps
g. Blood transfusion
h. Concussion &amp; Acquired Brain Injury
i. Circumcisions
j. Cardiology &amp; Cardiac Testing
k. Dermatology
l. Dentistry
m. ENT
n. Endocrinology
o. Obstetrics &amp; Gynecology
p. Genetics
q. Geriatrics
i. Falls clinic: https://www.rgpeo.com/en/ways-to-refer/
r. General Surgery
s. Gastroenterology &amp; Hepatology
t. Hematology &amp; Thrombosis
u. Internal Medicine
v. Infectious Diseases
w. Longevity Medicine/Preventative
x. Medical Imaging/Radiology
y. Nephrology
z. Neurology &amp; TIA/Stroke
aa. Neurosurgery
bb. Obesity Medicine
cc. Obstetrics &amp; Women’s Health (Family MDs)
dd. Oncology
ee. Ophthalmology
ff. Orthopaedic Surgery &amp; specialised clinics
i. Ottawa Orthopedaedic Centre. 1371 Woodroffe. Fax 613-714-9454
gg. Pain Clinics
hh. Palliative Care
ii. Pediatrics

jj. Physiatry
kk. Plastic Surgery
ll. Psychiatry &amp; Mental Health
mm. Respirology
nn. Rheumatology
oo. Sleep Medicine
pp. Sports Medicine
qq. Thoracic Surgery
rr. Urology
ss. Urgent Care Clinics
tt. Vasectomy Clinics
uu. Vein Clinics
vv. Vascular Surgery
ww. Wound Care

7. Allied Care
a. Physiotherapy
b. Occupational therapy
c. Chiropractors
d. Registered Massage therapy
e. Ontario Health at Home
f. Mental Health Substance Use Health and Addictions

- Subspecialty (text)
- Accepted case types (comma-separated tags input)
- City / location (text — geocoded to lat/lng from a hardcoded city lookup for POC)
- Contact email
- Accepting new referrals (toggle)
- Next available date (date picker)
- Languages spoken (text)

After submit: show "You're registered! You'll appear in referral matches." confirmation card. `<FutureLabel>Credential verification coming in production</FutureLabel>`

---

### 8.3 SpecialistPortal

Shows a list of referrals directed to the logged-in specialist (demo: hardcoded to `spec_001` or selectable from a dropdown).

Each referral row shows: patient name (anonymized as initials for demo), specialty, urgency, status badge, date sent.

Clicking a referral opens a detail panel with:
- Referral content (read-only)
- "Approve" button → sets status to `approved`
- "Reject" button → opens `<RejectionReasonModal />`

`<RejectionReasonModal />`:
- Text area: "Reason for rejection (required)"
- Submit → sets status to `rejected`, stores reason, closes modal
- Rejection reason is displayed on the referral record with a red banner

---

### 8.4 DemoReset

Single page with a "Reset Demo Data" button. Clears all in-memory state and reloads fixtures. Shows a confirmation message. Link to this page lives in the nav.

---

## 9. Key Component Details

### `SpecialtyPredictionCard`

This is the visual centrepiece of the demo. Build it first.

```
┌─────────────────────────────────────────────────────────┐
│  🤖 AI Specialty Prediction          [AI-assisted]      │
│                                                         │
│  Orthopedic Surgery                                     │
│  ████████████████░░░░  82% confidence     HIGH         │
│                                                         │
│  Rationale                                              │
│  Recent chart entries show persistent right knee pain,  │
│  failed conservative management over 6 months, and      │
│  abnormal MRI findings. These findings align with       │
│  orthopedic surgical evaluation criteria.               │
│                                                         │
│  Source chart references                                │
│  [Mar 10 · Visit Note]  [Feb 14 · MRI Report]          │
│                                                         │
│  ⚠️  Medication list has not been updated in 90+ days   │
│                                                         │
│  [Accept & Continue]  [Override Specialty ▾]            │
└─────────────────────────────────────────────────────────┘
```

- Confidence bar: green if ≥ 0.80, yellow if 0.50–0.79, red if < 0.50
- Confidence label: HIGH / MEDIUM / LOW
- Source references are clickable chips that expand the chart entry inline
- Warnings render in `warning` color tokens
- The whole card is wrapped in `<AIGeneratedBlock />`

---

### `SpecialistCard`

```
┌──────────────────────────────────────────────────────┐
│  Dr. Aisha Patel                    ● Accepting      │
│  Toronto Orthopedic Centre                           │
│  Orthopedic Surgery · Sports Medicine                │
│                                                      │
│  📍 2.4 km away     📅 Next: Jul 8, 2026            │
│  ✓ Knee replacement  ✓ Sports injury                 │
│  🌐 English, Gujarati                                │
│                                                      │
│  [Select This Specialist]                            │
└──────────────────────────────────────────────────────┘
```

- Green dot for accepting referrals, grey dot if not
- Distance and next available always visible
- Case type chips show matched types highlighted in brand color
- Preference alignment: show a small "Matches preferences" green chip if the specialist aligns with patient preferences entered in Step 5

---

### `ChartSummary`

Groups chart entries by type. Each group is a collapsible section:
- Visit Notes
- Lab Results
- Imaging
- Medications
- Allergies

Each entry shows date, a type badge, title, and a collapsed preview. Click to expand full content. Entries used by the AI prediction are highlighted with a subtle brand-50 background.

---

## 10. API Layer

Each file in `src/api/` exports async functions. They check `import.meta.env.VITE_USE_MOCK` — if true, return fixture data with a simulated 400ms delay. If false, fetch from the real backend.

```js
// src/api/patients.js
import { patients } from '../fixtures/patients'
import { chartEntries } from '../fixtures/chartEntries'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

const delay = (ms) => new Promise(r => setTimeout(r, ms))

export async function searchPatients(query) {
  if (MOCK) {
    await delay(400)
    return patients.filter(p =>
      p.name.toLowerCase().includes(query.toLowerCase())
    )
  }
  const res = await fetch(`${BASE}/api/v1/patients?q=${query}`)
  return res.json()
}

export async function getChartEntries(patientId) {
  if (MOCK) {
    await delay(400)
    return chartEntries.filter(e => e.patientId === patientId)
  }
  const res = await fetch(`${BASE}/api/v1/patients/${patientId}/chart-entries`)
  return res.json()
}
```

Same pattern for `referrals.js` and `specialists.js`.

---

## 11. Environment Variables

```bash
# .env.local
VITE_USE_MOCK=true
VITE_API_BASE=http://localhost:8000
```

---

## 12. Demo Context

`src/context/DemoContext.jsx` holds global demo state:

```js
{
  persona: 'physician',         // physician | admin | specialist | operator
  selectedPatient: null,
  currentReferral: null,
  currentStep: 1,
  specialists: [],              // in-memory specialist list (fixtures + registered)
}
```

Wrap `<App />` in `<DemoProvider>`. Use `useDemoContext()` hook to access and update state from any component.

---

## 13. Empty, Loading, and Error States

Every data-fetching component must handle three states:

- **Loading**: show `<Spinner />` centered in the component area
- **Empty**: show a short directive message (e.g. "No patients found. Try a different name.") — never just a blank space
- **Error**: show a red-bordered card with the error message and a "Try again" button

AI call specifically:
- If the AI call takes > 5s, show a progress message: "Reviewing chart history…"
- If it fails, fall back to the seeded mock prediction and show a subtle "Using demo data" badge

---

## 14. Referral Status Flow (Frontend)

The frontend manages referral status transitions in `DemoContext`. Valid transitions:

```
draft → previewed → selected_specialist → pending → sent → approved
                                                         → rejected → draft
```

On each transition, show a toast notification (bottom-right, 3s duration) confirming the status change. On `rejected`, auto-open `<RejectionReasonModal />`.

---

## 15. Build Priority Order

Build in this order — each step produces something demoable:

1. Fixture data + DemoContext setup
2. `SpecialtyPredictionCard` (hardcoded mock data) — visual centrepiece
3. `PatientSearch` + `ChartSummary` (Steps 1–2)
4. Step indicator + full PhysicianView shell
5. `ReferralDraftForm` (Step 4)
6. `PatientPreferencesForm` (Step 5)
7. `SpecialistList` + `SpecialistMap` (Step 6)
8. `ReferralPreview` + status transitions (Step 7)
9. `SpecialistRegister` page
10. `SpecialistPortal` + `RejectionReasonModal`
11. `DemoReset` page
12. Polish: transitions, empty states, error states, toasts

---

## 16. What Is Explicitly Out of Scope for Frontend

- Authentication, login, or user sessions
- Real API calls to external services (maps geocoding, fax, email)
- Real patient data
- Mobile responsiveness (desktop demo only for POC)
- Accessibility audit (deferred to production)
- Automated frontend tests (deferred unless time allows)
- Dark mode