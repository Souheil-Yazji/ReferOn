# ReferOn

> AI-assisted specialist referral platform for Ontario healthcare: reducing wait times, cutting administrative overhead, and getting patients to the right specialist faster.

---

## What It Does

Specialist referrals in Ontario are slow, manual, and error-prone. Physicians spend significant time writing referral letters, fax-blasting specialist offices, and chasing status updates — time that could be spent on patient care.

**ReferOn** addresses this by:

- **Parsing clinical notes** — AI extracts the relevant clinical context from a patient's chart
- **Matching to the right specialist** — suggests appropriate specialists based on condition, geography, and wait times
- **Drafting referral letters** — generates structured, complete referral letters ready for physician review
- **Tracking status** — gives referring physicians visibility into where a referral stands

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS v4, React Router |
| Maps | Leaflet |
| Icons | lucide-react |
| Backend | (your backend here) |
| AI | Claude (Anthropic) |
| Mock/Real API toggle | `VITE_USE_MOCK` env flag |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn

### Install & Run

```bash
git clone https://github.com/Souheil-Yazji/ReferOn.git
cd ReferOn/frontend
npm install
cp .env.example .env
npm run dev
```

The dev server will start at `http://localhost:5173` (or next available port).

To share over VS Code Live Share, the dev server is configured to bind to all interfaces:

```bash
npm run dev   # runs: vite --host
```

---

## Team

Built at a healthcare AI hackathon by:

- 🧠 **Souheil Yazji** ([@Souheil-Yazji](https://github.com/Souheil-Yazji))
- 🩺 Sana Musa
- ⚙️ **Anas Abushaikha** ([@anasabushaikha](https://github.com/anasabushaikha))
- 🎨 **Jason Au** ([@sightsontheheights](https://github.com/sightsontheheights))

---

## Project Structure

```
ReferOn/
├── frontend/                        # React 18 + Vite + Tailwind v4
│   ├── src/
│   │   ├── pages/                   # Route-level page components
│   │   ├── components/              # Shared UI components
│   │   ├── api/                     # Mock / real API toggle layer (VITE_USE_MOCK)
│   │   └── fixtures/                # Fixture data for mock mode
│   ├── public/
│   └── vite.config.js
│
├── backend/                         # TypeScript API server
│   ├── src/                         # Application source
│   ├── data/                        # Seed / reference data
│   ├── docs/                        # API documentation
│   ├── scripts/                     # Utility scripts
│   ├── tests/                       # Test suites
│   ├── drizzle/                     # DB migrations (Drizzle ORM)
│   ├── drizzle.config.ts
│   ├── openapi.yaml                 # OpenAPI spec
│   ├── tsconfig.json
│   └── vitest.config.ts
│
└── README.md
```

---

## Why It Matters

Ontario's specialist referral system is largely fax-based and fragmented. Patients wait weeks for referrals to even be processed before waiting months to be seen. ReferOn targets the administrative bottleneck — the time between a physician deciding a referral is needed and a specialist receiving a complete, actionable request — and uses AI to compress it from days to minutes.

---

## License

MIT
