# ReferOn Backend

Fastify + TypeScript + Drizzle + SQLite JSON API for the ReferOn POC.

## Requirements

- Node.js 18+ (tested with v23)
- npm

## Setup

```bash
cd backend
npm install
cp .env.example .env          # edit AI_SERVICE_URL if needed
npm run db:migrate            # create SQLite tables
npm run db:seed               # load demo patients, charts, specialists
npm run dev                   # start with hot reload on port 3001
```

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3001` | HTTP listen port |
| `DATABASE_URL` | `file:./data/referon.db` | LibSQL/SQLite file path |
| `AI_SERVICE_URL` | `http://localhost:8000` | AI teammate's service URL |
| `AI_TIMEOUT_MS` | `30000` | AI call timeout in milliseconds |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origin for frontend dev |
| `NODE_ENV` | `development` | `development` | `production` | `test` |

## Demo data

Three seeded patient scenarios are included:

| Patient | Scenario | ID |
| --- | --- | --- |
| Margaret Chen | Orthopedic Surgery (knee OA) | `pat_ortho_001` |
| David Okafor | Cardiology (exertional chest pain, ECG changes) | `pat_cardio_002` |
| Sofia Reyes | Ambiguous (fatigue + weight loss, low-confidence) | `pat_ambig_003` |

15 Toronto-area specialists across Orthopedic Surgery, Cardiology, Internal Medicine, and other specialties are seeded.

Reset demo data at any time:

```bash
curl -X POST http://localhost:3001/api/v1/demo/reset
```

## API

Base path: `http://localhost:3001/api/v1`

Full API reference: [`openapi.yaml`](./openapi.yaml)

| Endpoint | Description |
| --- | --- |
| `GET /patients` | Search patients |
| `GET /patients/:id/chart-entries` | Chart history by window |
| `POST /referrals` | Create manual referral |
| `POST /referrals/from-chart` | AI-assisted referral from chart |
| `GET /referrals/:id` | Full referral aggregate |
| `PATCH /referrals/:id` | Update draft + preferences |
| `POST /referrals/:id/preview` | Transition to previewed |
| `POST /referrals/:id/select-specialist` | Attach specialist |
| `POST /referrals/:id/send` | Simulate send |
| `POST /referrals/:id/approve` | Approve referral |
| `POST /referrals/:id/reject` | Reject with required reason |
| `GET /referrals/:id/specialist-matches` | Ranked specialist matches |
| `POST /specialists/register` | Specialist self-registration |
| `GET /specialists` | Search specialists |
| `PATCH /specialists/:id` | Update profile + availability |
| `POST /demo/reset` | Reset to seed data |

## AI integration

The backend owns the AI service contract. See [`docs/ai-contract.md`](./docs/ai-contract.md) for the full schema.

When the AI service is unavailable or times out, the backend falls back to seeded demo predictions automatically (NFR-012). Manual referral creation never depends on the AI service.

## Tests

```bash
npm test               # run all tests once
npm run test:watch     # watch mode
npm run test:coverage  # with coverage report
```

Tests use an in-memory SQLite database and Fastify's `inject` method — no running server needed.

## Project structure

```
src/
  index.ts                     # server bootstrap
  config/env.ts                # typed environment config
  db/
    schema.ts                  # Drizzle table definitions
    client.ts                  # DB connection
    migrate.ts                 # migration runner
    seed/
      patients.json            # demo patient fixtures
      chart_entries.json       # demo chart fixtures
      specialists.json         # demo specialist fixtures
      run.ts                   # seed runner (also called by /demo/reset)
  routes/
    patients.ts
    referrals.ts
    specialists.ts
    demo.ts
  services/
    referralService.ts         # referral CRUD, state transitions, AI orchestration
    matchingService.ts         # haversine filter + weighted ranking
    chartService.ts            # chart retrieval + staleness check
  adapters/ai/
    types.ts                   # AI service contract types
    client.ts                  # HTTP call with timeout + fallback
    fallback.ts                # seeded demo predictions
  lib/
    ids.ts                     # prefixed ID generators
    distance.ts                # haversine formula
    referralStateMachine.ts    # valid status transitions
tests/
  unit/                        # distance, state machine, AI fallback
  integration/                 # route tests via Fastify inject
drizzle/                       # generated SQL migrations
docs/
  ai-contract.md               # AI service HTTP contract for AI teammate
openapi.yaml                   # API spec for frontend teammate
```
