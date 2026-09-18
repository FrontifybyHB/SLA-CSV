# SLA-CSV — CSV-Driven SLA Observability

A full-stack MERN application for ingesting raw service-level telemetry CSV files, normalizing and deduplicating the data, and providing a dashboard for SLA monitoring with quality metrics.

---

## Problem Statement

Organizations running multi-agent monitoring systems (e.g., uptime probes from `agent1`, `agent2`, `agent3`) collect raw CSV extracts containing timestamped observations. These CSVs are often:

- **Inconsistent** — varying headers, mixed case, extra columns
- **Noisy** — duplicate rows, malformed timestamps, missing values
- **Incomplete** — gaps in coverage where agents failed to report
- **Hard to audit** — no traceability from raw row to computed SLA

**Goal**: Build a system that accepts raw CSV uploads, strictly validates and normalizes each row, computes per-service availability slots (1-minute windows), fills missing slots, and exposes a dashboard + API for inspecting datasets, quality reports, and SLA metrics — all with idempotent, auditable imports.

---

## Solution Overview

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Client     │────▶│  API Gateway │────▶│  Import Pipeline│────▶│  PostgreSQL  │
│  (React)    │     │  (Express)   │     │  (Domain Core)  │     │  (Persisted) │
└─────────────┘     └──────────────┘     └─────────────────┘     └──────────────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │  Auth (JWT)  │     │  Quality Metrics│
                    │  + Rate Limit│     │  (Per Service)  │
                    └──────────────┘     └─────────────────┘
```

### Core Pipeline (Zero-I/O, Deterministic)

1. **Strict CSV Parse** — Rejects ragged rows, validates header shape, enforces column types
2. **Row Normalization** — Canonicalizes fields (agent_id, timestamp, latency_ms, status), collects issues per row
3. **Deduplication** — Content-hash fingerprinting; identical rows are collapsed
4. **Same-Agent Slot Evidence** — Groups observations into 15-minute windows per agent
5. **Multi-Agent Slot Resolution** — Combines evidence across agents; majority vote with UP > DOWN > UNKNOWN tiebreak
6. **Missing Slot Generation** — Fills gaps in each service's timeline from min to max observed time
7. **Quality Metrics** — Computes per-service: expected/observed/missing slots, uptime %, median & p95 latency

### Idempotency

- **Fingerprint** = SHA-256(file_bytes) + policy_version + user_id
- Re-uploading the same file returns the existing `datasetId` with `duplicate: true`
- No partial datasets — each import commits atomically

---

## Folder Structure

```
SLA-CSV/
├── client/                          # React 19 + Vite + TypeScript
│   ├── src/
│   │   ├── app/                     # App shell, routing, providers, error boundary
│   │   ├── features/                # Feature-scoped modules (colocated hooks, api, components)
│   │   │   ├── auth/                # Auth: login/register, session, RequireAuth guard
│   │   │   └── datasets/            # Dataset upload, list, select, import summary
│   │   ├── pages/                   # Route-level pages
│   │   │   ├── home/                # Landing: Hero, Features, HowItWorks, API Example, CTA
│   │   │   ├── dashboard/           # Authenticated dashboard
│   │   │   │   └── ingest/          # CSV ingest workspace (upload, stream, inventory, diagnostics)
│   │   │   └── auth/                # Login / Register page
│   │   ├── shared/                  # Cross-cutting: API kernel, UI primitives, styles, lib
│   │   │   ├── api/                 # fetch wrapper, query string, error types
│   │   │   ├── ui/                  # Button, Card, Input, Select, TopNav, StatusBadge, etc.
│   │   │   ├── styles/              # CSS tokens, globals, topnav
│   │   │   └── lib/                 # format, logger
│   │   ├── test/                    # Vitest + React Testing Library setup & tests
│   │   └── main.tsx                 # Entry point
│   ├── vite.config.ts
│   ├── tsconfig.app.json
│   └── package.json
│
├── server/                          # Express 5 + TypeScript (ESM)
│   ├── src/
│   │   ├── app.ts                   # Express app factory (middleware, routes, error handling)
│   │   ├── server.ts                # HTTP server bootstrap
│   │   ├── config/                  # env, cookie config
│   │   ├── contracts/               # TypeScript interfaces (repository, import, reporting, auth)
│   │   ├── controllers/             # Request handlers (auth, dataset, dashboard)
│   │   ├── domain/                  # Pure business logic (zero I/O, fully tested)
│   │   │   ├── constants.ts         # Agent IDs, slot duration, policy version
│   │   │   ├── csv.ts               # CSV types & helpers
│   │   │   ├── StrictCsvParser.ts   # Header validation, row parsing, ragged-row rejection
│   │   │   ├── RowNormalizer.ts     # Field aliasing, type coercion, status classification
│   │   │   ├── DuplicateRemover.ts  # Content-hash dedupe
│   │   │   ├── FieldAliasResolver.ts# Canonical field mapping
│   │   │   ├── SlotResolver.ts      # Multi-agent slot resolution (majority vote)
│   │   │   ├── AgentEvidenceResolver.ts # 15-min per-agent evidence building
│   │   │   ├── MissingSlotGenerator.ts  # Gap-filling per service timeline
│   │   │   ├── QualityMetricsCalculator.ts # Per-service SLA metrics
│   │   │   ├── SlaCsvProcessor.ts   # Orchestrates the full pipeline
│   │   │   ├── FileHasher.ts        # SHA-256 for idempotency keys
│   │   │   └── StatusClassifier.ts  # UP/DOWN/UNKNOWN classification
│   │   ├── middlewares/             # auth, validate, rateLimit, fileUpload, errorHandler, logger, requestId
│   │   ├── repositories/            # Postgres implementations (dataset, user, refreshToken, reporting)
│   │   ├── routes/                  # Router factories (auth, dataset, reporting)
│   │   ├── services/                # Application services (authService, importService, SlaDatasetImporter, reportingService)
│   │   ├── validators/              # Joi schemas (auth, request)
│   │   ├── errors/                  # Custom error classes (ImportError, tokenErrors, appError)
│   │   └── db/                      # Pool, migrations, schema.sql
│   │       ├── schema.sql           # Datasets, observations, slots, data_quality_issues
│   │       ├── migrate.ts           # Migration runner
│   │       └── migrations/          # Versioned SQL migrations
│   ├── tests/                       # Domain unit tests (slots, csv, normalize, slaRequired13, isolation, auth)
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   └── package.json
│
└── README.md                        # This file
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite 7, TanStack Query v5, React Icons |
| **Backend** | Node.js 22+, Express 5, TypeScript (ESM), tsx |
| **Database** | PostgreSQL (pg), custom migrations |
| **Auth** | JWT (access + refresh cookies), bcryptjs, httpOnly cookies |
| **Validation** | Joi (server), custom (client) |
| **CSV Parsing** | csv-parse (streaming, strict mode) |
| **Logging** | Winston + Morgan |
| **Security** | Helmet, CORS, rate limiting (in-memory) |
| **Testing** | Vitest (client), Node test runner (server), React Testing Library |
| **Lint/Typecheck** | ESLint 9 + TypeScript ESLint, `tsc --noEmit` |

---

## Completed Features

### Backend (Server)

- **Authentication System**
  - User registration & login with bcrypt password hashing
  - JWT access tokens (short-lived) + refresh tokens (rotating, httpOnly cookies)
  - `/auth/me` endpoint for session validation
  - Rate limiting on auth endpoints (register/login)
  - Logout with refresh token revocation

- **Dataset Import Pipeline**
  - `POST /api/v1/datasets` — Accepts `text/csv` (max 5MB), returns import result
  - Strict CSV parsing with header validation & ragged-row rejection
  - Row normalization: field alias resolution, type coercion, status classification (UP/DOWN/UNKNOWN)
  - Content-hash deduplication (SHA-256)
  - 15-minute per-agent slot evidence resolution
  - Multi-agent slot resolution with majority vote (UP > DOWN > UNKNOWN)
  - Missing slot generation per service (fills timeline gaps)
  - Quality metrics per service: expected/observed/missing slots, uptime %, median & p95 latency
  - Idempotent imports via composite key (file_hash + policy_version + user_id)
  - Atomic DB persistence (datasets, observations, slots, issues in single transaction)
  - `GET /api/v1/datasets` — List user's datasets with summary counts
  - `GET /api/v1/datasets/:id` — Dataset detail with metadata

- **Reporting / Dashboard API**
  - `GET /api/v1/reporting/stats` — Aggregate availability across datasets (filterable by date range, service, region)
  - `GET /api/v1/reporting/logs` — Paginated observation logs with filters
  - `GET /api/v1/reporting/slots` — Paginated resolved slots with status & latency

- **Database Schema**
  - `datasets` — Metadata + fingerprint for idempotency
  - `observations` — Normalized rows (agent_id, timestamp, latency_ms, status)
  - `slots` — Resolved 1-minute slots with uptime/downtime/unknown breakdown
  - `data_quality_issues` — Per-row issues (row_number, field, message)
  - Indexes for query patterns (dataset+time, dataset+agent+time)

- **Infrastructure**
  - Request ID middleware (correlation IDs)
  - Structured logging (Winston + Morgan)
  - Global error handler with typed error responses
  - Input validation middleware (Joi)
  - File upload middleware (raw body, content-type enforcement, size limit)
  - Database connection pool with graceful shutdown

### Frontend (Client)

- **Landing Page** (`/`)
  - Hero section with value proposition
  - Feature grid (4 capabilities: strict parsing, idempotent imports, quality reports, dashboard)
  - How-it-works pipeline (4 steps: Upload → Parse → Normalize → Inspect)
  - API example with copyable cURL snippet
  - CTA to dashboard

- **Authentication Pages** (`#login`, `#register`)
  - Login form with email/password
  - Registration with password strength meter & compliance strip
  - Client-side validation + server error surfacing
  - Trust column with security messaging

- **Dashboard** (`#dashboard`) — **Protected Route**
  - **Top Navigation** — User avatar, sign out, route-aware active states
  - **Workspace Header** — Context breadcrumb
  - **CSV Ingest Controller** — Drag-and-drop / file picker, client-side validation, upload with progress
  - **Stream Inspector** — Live preview of parsed rows (first 100) with status badges
  - **Schema Alert** — Warns when uploaded CSV has unexpected columns
  - **Datasets Table** — Paginated, sortable inventory of imported datasets
  - **Dataset Select** — URL-synced dropdown (shared via address bar)
  - **Dataset Overview** — Metadata card: rows, slots, issues, agents, policy version, coverage window
  - **Import Summary Toast** — Post-upload confirmation with "View dataset" action
  - **Diagnostic Panel** (lazy-loaded) — Per-service quality metrics drill-down
  - **Empty State Preview** (lazy-loaded) — Guidance when no dataset selected
  - **Status Bar** — Pinned bottom, shows connection state & last sync

- **Shared UI Components**
  - Button (primary/secondary/ghost, loading state)
  - Card, Collapsible, EmptyState, ErrorState, Skeleton
  - Input, Select, Field (label + hint + error)
  - StatusBadge (UP/DOWN/UNKNOWN/MIXED with color coding)
  - TopNav, AppFooter, Icon (Material Symbols)
  - Spinner, Format utilities (count, UTC datetime)

- **Developer Experience**
  - TanStack Query for server state (caching, deduping, retries)
  - Code-split routes + lazy components (DiagnosticPanel, EmptyStatePreview)
  - Centralized API kernel with auto-refresh on 401
  - Type-safe API contracts shared via `features/*/api/*.ts`
  - Vitest + React Testing Library (component + hook tests)
  - ESLint + TypeScript strict mode

---

## In Progress / Planned

| Feature | Status | Notes |
|---------|--------|-------|
| **Per-service diagnostic rail** | 🔄 Partial | Backend metrics exist; frontend DiagnosticPanel scaffolded |
| **Slot timeline visualization** | 📋 Planned | Chart component for uptime/downtime over time |
| **Export dataset (CSV/JSON)** | 📋 Planned | `GET /api/v1/datasets/:id/export` |
| **Multi-user organizations / RBAC** | 📋 Planned | Currently single-user scoping via `user_id` |
| **Webhook / async import for large files** | 📋 Planned | Current 5MB sync limit |
| **Policy version migration tooling** | 📋 Planned | Schema versioning for checklist format changes |
| **E2E tests (Playwright)** | 📋 Planned | Critical user flows: auth → upload → inspect |

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login, sets access + refresh cookies |
| `POST` | `/api/v1/auth/refresh` | Rotate access token via refresh cookie |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token, clear cookies |
| `GET` | `/api/v1/auth/me` | Validate session, return user profile |

### Datasets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/datasets` | Upload CSV (Content-Type: `text/csv`, max 5MB) |
| `GET` | `/api/v1/datasets` | List user's datasets (summary) |
| `GET` | `/api/v1/datasets/:id` | Get dataset detail |

**Upload Request:**
```
POST /api/v1/datasets
Authorization: Bearer <access_token>
Content-Type: text/csv

<csv bytes>
```

**Upload Response (201 Created / 200 OK if duplicate):**
```json
{
  "success": true,
  "data": {
    "duplicate": false,
    "datasetId": "uuid",
    "observationCount": 1250,
    "slotCount": 1180,
    "issueCount": 12,
    "fileHash": "sha256...",
    "policyVersion": "1.0.0",
    "startDate": "2025-01-15T00:00:00Z",
    "endDate": "2025-01-15T23:59:00Z"
  }
}
```

### Reporting

| Method | Endpoint | Query Params | Description |
|--------|----------|--------------|-------------|
| `GET` | `/api/v1/reporting/stats` | `from`, `to`, `service`, `region` | Aggregate availability stats |
| `GET` | `/api/v1/reporting/logs` | `from`, `to`, `service`, `region`, `page`, `pageSize` | Paginated observation logs |
| `GET` | `/api/v1/reporting/slots` | `from`, `to`, `service`, `region`, `page`, `pageSize` | Paginated resolved slots |

---

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 15+
- pnpm (or npm/yarn)

### Environment Variables

**Server** (`server/.env`):
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/sla_csv
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
COOKIE_DOMAIN=localhost
CLIENT_ORIGIN=http://localhost:5173
```

**Server runtime config for the browser** (`server/.env`):
```env
# Same-origin monolith (default) — server serves /config.js with this value
API_BASE_URL=/api/v1

# Only when API is on another domain:
# API_BASE_URL=https://your-production-domain.com/api/v1
```

**Client** (optional — only for separate frontend deploys; monolith uses `/config.js`):
```env
# VITE_API_BASE=https://your-production-domain.com/api/v1
```

### Install & Run

```bash
# Server
cd server
npm install
npm migrate        # Runs migrations against DATABASE_URL
npm dev            # Starts on :3000 with tsx watch

# Client (separate terminal)
cd client
npm install
npm dev            # Starts Vite on :5173
```

### Useful Commands

```bash
# Server
npm run build:client  # Build React app into server/public/
npm run build:all     # Client build + TypeScript compile to dist/
npm build             # TypeScript compile to dist/
npm start             # Run compiled dist/server.js
npm lint           # ESLint
npm typecheck      # tsc --noEmit
npm test           # Node test runner (domain tests)

# Client
npm build          # TypeScript + Vite build
npm preview        # Preview production build
npm lint           # ESLint
npm typecheck      # tsc -b
npm test           # Vitest run
npm test:watch     # Vitest watch mode
```

---

## CSV Format Expectations

The importer accepts flexible headers (case-insensitive, aliases supported):

| Canonical Field | Accepted Aliases | Type | Required |
|-----------------|------------------|------|----------|
| `agent_id` | `agent`, `agentId`, `Agent` | string (agent1\|agent2\|agent3) | Yes |
| `timestamp` | `time`, `ts`, `date`, `DateTime` | ISO 8601 / RFC3339 | Yes |
| `latency_ms` | `latency`, `latencyMs`, `response_time` | integer (ms) | No |
| `status` | `state`, `availability`, `Status` | UP/DOWN/UNKNOWN (case-insensitive) | Yes |
| `service` | `svc`, `Service`, `service_name` | string | No |
| `region` | `loc`, `location`, `Region` | string | No |

**Example:**
```csv
agent_id,timestamp,latency_ms,status,service,region
agent1,2025-01-15T10:00:00Z,45,UP,api,us-east
agent2,2025-01-15T10:00:00Z,52,UP,api,us-east
agent3,2025-01-15T10:00:00Z,,DOWN,api,us-east
agent1,2025-01-15T10:01:00Z,43,UP,api,us-east
```

---

## Quality Metrics Explained

Per import, the pipeline computes **per-service** metrics:

| Metric | Meaning |
|--------|---------|
| `expectedSlots` | Total 1-min slots in service's observed time range |
| `observedSlots` | Slots with at least one agent reporting |
| `missingSlots` | Slots with zero agent reports (gap-filled as UNKNOWN) |
| `upSlots` / `downSlots` / `unknownSlots` | Resolved status counts |
| `uptimePercentage` | `(upSlots / expectedSlots) * 100` (2 decimal precision) |
| `medianLatencyMs` | p50 of successful observations |
| `p95LatencyMs` | p95 of successful observations |

These are returned in the import response (`metrics` field) and available via the reporting API.

---

## License

ISC — See `LICENSE` (or package.json) for details.