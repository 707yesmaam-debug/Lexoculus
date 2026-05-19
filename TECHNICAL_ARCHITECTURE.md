# LexOculus — Technical Architecture Document

> **Repo**: `lexoculus`
> **Version**: 1.0.0

---

## 1. Platform Overview

**LexOculus** is an EU AI Act compliance platform that scans GitHub repositories, detects AI capabilities, classifies risk under Regulation (EU) 2024/1689, and generates legally-referenced compliance reports. It operates a **5-stage sequential scan pipeline** backed by a hybrid deterministic + LLM analysis engine.

---

## 2. Tech Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js (App Router) | 16.1.1 | Full-stack React framework with server-side rendering |
| **Language** | TypeScript (strict mode) | 5.x | `ES2017` target, `bundler` module resolution, `@/*` path alias |
| **Runtime** | React | 19.2.3 | UI rendering with concurrent features |
| **Database** | PostgreSQL | — | Hosted via Supabase |
| **ORM** | Prisma | 7.2.0 | Type-safe DB access, 20 models, 573-line schema |
| **Auth** | Supabase Auth (SSR) | 0.8.0 | Email + GitHub OAuth via `@supabase/ssr` middleware |
| **AI/LLM** | Groq API | — | `llama-3.3-70b-versatile` (default), OpenAI-compatible REST |
| **Styling** | Tailwind CSS v4 + Vanilla CSS | 4.x | "Optical Legality" design system (brutalist aesthetic) |
| **Animations** | Framer Motion | 12.x | Page transitions, scan animations, micro-interactions |
| **3D Graphics** | Three.js + React Three Fiber + Drei | 0.182 / 9.x / 10.x | Landing page 3D effects |
| **UI Primitives** | Radix UI | Various | Dialog, Select, Tabs, Progress, Radio, Label, Separator (7 primitives) |
| **Forms** | React Hook Form + Zod | 7.x / 4.x | Type-safe form validation |
| **Rate Limiting** | Upstash Redis | 1.36.x | Distributed rate limiting with in-memory fallback |
| **PDF Generation** | PDFKit | 0.17.x | Compliance report PDF rendering |
| **Logging** | Pino | 10.x | Structured JSON logging |
| **Payments** | Dodo Payments SDK | 2.19.x | B2B subscriptions (EUR only, €99/mo or €999/yr) |
| **Email** | Nodemailer | 8.x | Transactional emails |
| **Deployment** | Vercel | — | Production hosting + Vercel Analytics |
| **MCP Server** | `@modelcontextprotocol/sdk` | 1.12.x | Standalone MCP server for AI coding assistants |
| **Encryption** | Node.js `crypto` | Built-in | AES-256-GCM for token encryption |
| **Testing** | Jest + ts-jest + jsdom | 30.x | Unit tests in `__tests__/unit/` |
| **Linting** | ESLint + eslint-config-next | 9.x | Code quality enforcement |
| **Bundler** | Turbopack | — | Next.js 16 default bundler |
| **Build** | `prisma generate && next build` | — | Prisma client generation → Next.js production build |

---

## 3. Project Structure

```
complianceAI/
├── prisma/
│   ├── schema.prisma              # 573 lines, 20 models
│   └── *.sql                      # 8 migration/RLS policy files
├── src/
│   ├── middleware.ts               # Supabase SSR auth + route protection
│   ├── app/
│   │   ├── api/                    # 41 API endpoint directories
│   │   ├── dashboard/              # 12 authenticated dashboard pages
│   │   ├── scan/[id]/              # Public scan results (no auth)
│   │   ├── auth/                   # Login, Signup, Password Reset
│   │   ├── admin/                  # Admin panel (email-gated)
│   │   ├── pricing/                # Pricing page
│   │   ├── legal/                  # Compliance, Privacy, Security, Terms
│   │   └── page.tsx                # Landing page (HeroScanForm)
│   ├── components/                 # 20 custom + 15 Radix UI primitives
│   └── lib/                        # Core business logic (8 subdirectories)
│       ├── analysis/               # Dependency scanner, AI library DB, Groq client
│       ├── compliance/eu-ai-act/   # Risk classifier, GPAI, constraint engine, etc.
│       ├── github/                 # GitHub API + security
│       ├── infra/                  # Prisma, Supabase, Logger, Storage
│       ├── mcp/                    # MCP API key management
│       ├── output/                 # PDF generator, document generator, report signer
│       ├── platform/               # Subscription, payments, email, admin, users
│       └── security/               # Rate limiting, encryption, tripwire, guardian agent
├── mcp-server/                     # Standalone MCP server (separate package)
├── packages/mcp-client/            # MCP client package
├── __tests__/unit/                 # Jest unit tests
├── scripts/                        # Utility scripts
└── public/                         # Static assets
```

---

## 4. Core Engine Architecture — The 5-Stage Scan Pipeline

```
┌──────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐    ┌────────┐
│ 1.SCANNER │───▶│ 2.LLM ANALYSIS│───▶│ 3.RISK CLASSIFY │───▶│ 4.CONTEXT VERIFY │───▶│ 5.REPORT│
└──────────┘    └──────────────┘    └─────────────────┘    └──────────────────┘    └────────┘
```

### 4.1 Stage 1 — Dependency Scanner (`dependency-scanner.ts`, 1084 lines)

**Purpose**: Deterministic AI/ML library detection without LLM involvement.  
**Performance**: ~10ms per scan (no network calls).

#### 3-Layer Detection Architecture

| Layer | Name | Method | Confidence |
|-------|------|--------|------------|
| **Layer 1** | Known Database | Exact match against 200+ AI library database | 0.9–1.0 |
| **Layer 2** | Pattern Matching | Regex + namespace prefix detection | 0.5–0.85 |
| **Layer 3.5** | Context Signals | README keyword + AI file name heuristics | Variable |

#### 9 Manifest Parsers

The scanner can parse dependencies from **9 different package manifest formats**:

| Parser | Format | Language |
|--------|--------|----------|
| `parseRequirementsTxt()` | `requirements.txt` | Python |
| `parsePackageJson()` | `package.json` | Node.js |
| `parsePyprojectToml()` | `pyproject.toml` | Python |
| `parseSetupPy()` | `setup.py` | Python |
| `parsePipfile()` | `Pipfile` | Python |
| `parseEnvironmentYml()` | `environment.yml` | Conda |
| `parseGoMod()` | `go.mod` | Go |
| `parseCargoToml()` | `Cargo.toml` | Rust |
| `extractPythonImports()` / `extractJSImports()` | Source code | Python/JS/TS |

#### AI Pattern Detection

30+ regex patterns organized by category:
- **LLM/Generative AI**: `llm`, `gpt`, `claude`, `gemini`, `langchain`, `crewai`
- **Deep Learning**: `torch`, `tensorflow`, `keras`, `jax`, `flax`
- **Computer Vision**: `opencv`, `yolo`, `detectron`
- **NLP**: `nltk`, `spacy`, `huggingface`, `tokenizers`
- **Cloud AI Services**: AWS Bedrock/SageMaker, Azure OpenAI, GCP AI Platform
- **Vector DBs**: `pinecone`, `weaviate`, `qdrant`, `chroma`, `faiss`
- **Biometrics**: `face_recognition`, `deepface`, `insightface`, `dlib`
- **Reinforcement Learning**: `gym`, `stable_baselines`, `ray_rllib`

#### Risk Indicators Detected

```typescript
interface RiskIndicators {
    uses_computer_vision: boolean;
    uses_biometric_processing: boolean;
    uses_emotion_recognition: boolean;
    uses_critical_infrastructure: boolean;
    uses_generative_ai: boolean;
    uses_nlp: boolean;
    uses_nlp_decision_making: boolean;
    targets_vulnerable_persons: boolean;
    high_impact_decision_making: boolean;
}
```

#### AI Library Database (`ai-library-database.ts`, 38KB)

- **200+ curated AI/ML libraries** with metadata
- Each entry contains: `name`, `aliases`, `category`, `risk_indicators`, `confidence`, `high_risk_flag`
- Model file detection (`.pt`, `.h5`, `.onnx`, `.pkl`, `.safetensors`, etc.)
- Library statistics tracking (`LIBRARY_STATS`)

---

### 4.2 Stage 2 — LLM Capability Analysis (`groq.ts`, 568 lines)

**Purpose**: Context-aware AI system analysis using Groq's fast inference API.

#### Hybrid Analysis Approach

1. **Deterministic scanner runs FIRST** (~10ms) → produces verified library data
2. **LLM analyzes PURPOSE/CONTEXT only** — does not guess libraries

#### 4-Layer Enhanced Prompt

| Layer | Source | Authority |
|-------|--------|-----------|
| Layer 1 (VERIFIED) | Known database matches | Scanner — highest trust |
| Layer 2 (CANDIDATES) | Pattern-matched packages | Scanner — medium trust |
| Layer 3 (CONTEXT) | README keywords + AI file names | Scanner — API wrapper detection |
| Layer 4 (JUDGMENT) | LLM reasoning | LLM — can override/supplement |

#### LLM Configuration

| Parameter | Value |
|-----------|-------|
| API | `https://api.groq.com/openai/v1/chat/completions` |
| Default Model | `llama-3.3-70b-versatile` |
| Temperature | 0.3 (low for consistent JSON) |
| Max Tokens | 2,000 |
| Response Format | Raw JSON (no markdown) |
| Tailored Questions | Separate 8s-timeout call, temp 0.4, 500 tokens |
| Health Check | `GET /v1/models` with API key validation |

#### Analysis Result Schema

```typescript
interface AnalysisResult {
    is_ai_system: boolean;
    capabilities: string[];           // e.g., ["Computer Vision", "NLP"]
    libraries: string[];              // Detected AI/ML libraries
    ai_frameworks: string[];          // e.g., ["PyTorch", "TensorFlow"]
    programming_languages: string[];
    detected_model_types: string[];   // e.g., ["Transformer", "LLM"]
    has_ml_pipeline: boolean;
    has_training_code: boolean;
    has_inference_code: boolean;
    has_data_processing: boolean;
    has_model_serialization: boolean;
    estimated_risk_indicators: RiskIndicators;
    reasoning: string;
}
```

#### Anti-Hallucination Guards

- Validates all required JSON fields
- Caps `capabilities` at 20 entries (rejects likely hallucinations)
- Falls back to default risk indicators for missing fields
- Separate confidence scoring that factors scanner data

---

### 4.3 Stage 3 — Risk Classification Engine (`risk-classifier.ts`, 1018 lines)

**Purpose**: Maps detected AI capabilities to EU AI Act Annex III articles and assigns risk tier.

#### 10-Step Classification Pipeline

| Step | Action |
|------|--------|
| 1 | Check **UNACCEPTABLE** risk (Article 5 prohibitions) |
| 2 | Check **HIGH RISK** (Articles 6–27, Annex III) |
| 3 | Check **LIMITED RISK** (Articles 37–40, 50) |
| 4 | Handle NLP systems |
| 5 | Handle Computer Vision (non-biometric) |
| 6 | Handle High-Impact Decision Making |
| 6.5 | Catch-all evidence for detected libraries |
| 7 | Default to MINIMAL_RISK if no matches |
| 8 | Calculate Risk Score (0–100) |
| 9 | Determine manual review need |
| 10 | Generate risk narrative |

#### Risk Scoring Formula

```
Base Score:
  UNACCEPTABLE = 100
  HIGH_RISK    = 75
  LIMITED_RISK = 45
  MINIMAL_RISK = 15

Modifiers:
  + confirmed HIGH_RISK articles × 3 (max +10)
  + ML pipeline (+3), training code (+2)
  - no inference code (-10)
  - low confidence < 0.7 (-10)
  + high confidence > 0.9 (+5)
```

#### Constraint Engine Integration

After the base LLM-based classification, the **Constraint Engine** (`constraint-engine.ts`, 539 lines) validates:

1. Runs pattern matching against EU AI Act knowledge base
2. Uses **fuzzy matching** (exact, substring, normalized dash/underscore)
3. Can **OVERRIDE** LLM classification (escalate or de-escalate)
4. Produces legal citations with official regulation text
5. Generates contextual questions for user verification
6. Creates audit trail (detected libraries → patterns → constraint matches)

#### Purpose-Aware Filtering (`purpose-categories.ts`)

Maps intended purpose categories to eligible Annex III articles. HIGH_RISK constraints are skipped if their category doesn't match the declared purpose. UNACCEPTABLE and LIMITED_RISK constraints are **never filtered** (safety bans and transparency always apply).

#### Annex III Articles Database (`annex-iii-articles.ts`, 47KB)

Encodes the full EU AI Act regulatory constraint set:
- **Article 5 constraints** (UNACCEPTABLE — social scoring, subliminal manipulation, etc.)
- **Annex III constraints** (HIGH_RISK — biometrics, critical infrastructure, employment, etc.)
- **Article 50 constraints** (LIMITED_RISK — chatbot disclosure, deepfake labeling, etc.)

Each constraint includes:
- `constraint_id`, `regulation_source`, `risk_level`, `category`
- `code_indicators` (strings that trigger matching)
- `official_text` (verbatim EU regulation text)
- `detection_method` (`code`, `context`, or `combination`)
- `exceptions` with `verification_questions`
- `contextual_questions` for user verification

---

### 4.4 GPAI Classification Engine (`gpai-classifier.ts`, 599 lines)

**Purpose**: Classifies AI systems as General-Purpose AI deployers/providers under Chapter V (Articles 51–55).

#### 10-Provider Database

| Provider | Systemic Risk (≥10²⁵ FLOPs) | Open Source |
|----------|:---:|:---:|
| OpenAI | ✅ | ❌ |
| Anthropic | ✅ | ❌ |
| Google DeepMind | ✅ | ❌ |
| Meta AI | ❌ | ✅ |
| Mistral AI | ❌ | ✅ |
| Cohere | ❌ | ❌ |
| Groq | ❌ | ❌ |
| Hugging Face | ❌ | ✅ |
| Stability AI | ❌ | ✅ |
| Perplexity | ❌ | ❌ |

Each provider has: `library_indicators` (npm/pip packages), `models` (known model names), `display_name`.

#### Detection Pipeline (10 steps)

1. Match against known GPAI providers (library → model → capability)
2. Detect orchestration frameworks (LangChain, LlamaIndex, AutoGen, etc.)
3. Check GPAI capability keywords
4. Determine GPAI deployer/provider status
5. Check open-source exception (Article 53(2))
6. Map obligations (Articles 53/55)
7. Map transparency requirements (Article 50)
8. Collect article references
9. Collect detected model names
10. Generate human-readable summary

#### Obligation Mapping

- **Provider Obligations** (Article 53): Technical documentation, downstream info, copyright compliance, training data summary
- **Systemic Risk** (Article 55): Model evaluation, adversarial testing, incident reporting, cybersecurity
- **Deployer Obligations** (Article 50): User notification, AI-generated content marking, deepfake disclosure

---

### 4.5 Stage 4 — Context Refiner Engine (`context-refiner.ts`, 770 lines)

**Purpose**: Refines preliminary risk assessment using user-provided context answers.

#### 11-Step Verification Pipeline

| Step | Action |
|------|--------|
| 1 | Generate use case evidence |
| 2 | Check autonomy issues (missing human oversight → escalate) |
| 3 | Process HIGH_RISK articles (biometrics, employment, essential services) |
| 4 | Process LIMITED_RISK articles (code generation, transparency) |
| 5 | Check safety & oversight measures |
| 6 | Check MINIMAL_RISK elevation |
| 7 | Calculate compliance readiness |
| 8 | Build context summary |
| 9 | Determine approval status |
| 10 | Generate final narrative |
| 11 | Calculate final score |

#### Escalation Rules

| Trigger | Result |
|---------|--------|
| Real-time biometric ID | → UNACCEPTABLE |
| Hiring without candidate transparency | → HIGH_RISK |
| Hiring without appeal process | → HIGH_RISK |
| Financial decisions without transparency | → HIGH_RISK |
| Autonomous decisions + no human oversight | → Escalate one tier |
| Minimal risk + no testing/oversight | → LIMITED_RISK |

#### Compliance Readiness Levels

- `FULL_COMPLIANCE` — All requirements met, no action items
- `PARTIAL_COMPLIANCE` — Some measures in place, non-HIGH_RISK
- `NEEDS_REVIEW` — HIGH_RISK with pending items
- `NON_COMPLIANCE` — UNACCEPTABLE classification

---

### 4.6 Stage 5 — Report Generation

#### PDF Generator (`pdf-generator.ts`, 30KB)

- Uses **PDFKit** for server-side PDF rendering
- Generates multi-page compliance reports with:
  - Executive summary
  - Risk classification breakdown
  - Matched Annex III articles with legal citations
  - Evidence trail
  - Compliance readiness assessment
  - Action items
- **Digital signature** via `report-signer.ts` (cryptographic signing)

#### Document Generator (`document-generator.ts`, 14.5KB)

- Auto-generates 5 EU AI Act compliance document types from templates
- Templates stored in `document-templates/` directory

---

### 4.7 Conformity Assessment Tracker (`conformity-assessment.ts`, 573 lines)

**Purpose**: Maps risk classification to the correct EU AI Act conformity assessment procedure.

#### Assessment Modules

| Module | Name | When Applied | Notified Body? | Timeline |
|--------|------|-------------|:-:|----------|
| **Module A** | Internal Control | HIGH_RISK, Annex III pts 2–8 (self-assessment) | ❌ | 12–22 weeks |
| **Module B+C** | EU-Type Examination | HIGH_RISK, biometrics (Annex III pt 1) | ✅ | 16–32 weeks |
| **NOT_REQUIRED** | Transparency Only | LIMITED_RISK, MINIMAL_RISK | ❌ | 1–2 weeks |
| **Prohibited** | N/A | UNACCEPTABLE | ❌ | N/A |

#### Module A Steps (6)

1. Establish Quality Management System (Articles 9–15, 17)
2. Prepare Technical Documentation (Article 11, Annex IV)
3. Testing & Validation (Article 9(7))
4. EU Declaration of Conformity (Articles 47–48, Annex V)
5. EU Database Registration (Article 49)
6. Post-Market Monitoring (Articles 72–73)

#### Module B+C Steps (6)

1. Select Notified Body (Articles 28–39)
2. Prepare Technical Documentation (Annex VII, Annex IV)
3. EU-Type Examination (Annex VII §4–5)
4. Conformity to Type (Annex VII §6)
5. EU Declaration of Conformity & Registration
6. Post-Market Monitoring

---

## 5. Anonymous Scan Pipeline

A zero-signup flow for public repos, parallel to the authenticated pipeline:

```
Landing Page → /api/anonymous-scan → /scan/[id] → Auth Gate → Signup → /api/claim-scan
                     │                    │
                     │ IP rate-limited     │ Auto-triggers
                     │ 1/IP/24h           │ analyze + classify
                     │                    │
                     ▼                    ▼
               scan_token (UUID)    Progressive loading UI
```

| Feature | Detail |
|---------|--------|
| Auth | None (IP-based rate limiting) |
| Rate Limit | 1 scan per IP per 24 hours |
| Ownership | `scan_token` (UUID) stored in `localStorage` |
| Expiry | 7 days (vs 30 days authenticated) |
| System User | `anonymous-system-user-0000` owns unclaimed scans |
| Claim Flow | `/api/claim-scan` transfers ownership after signup |

---

## 6. Database Schema (Prisma — 20 Models)

### Entity Relationship

```
User ──┬── AiSystem ──┬── RepoScan ──── LlmCapabilityAnalysis ──── RiskAssessment
       │              │          └── FinalRiskAssessment ──── ComplianceReport
       │              ├── ConformityAssessment
       │              ├── ComplianceDocument
       │              ├── ComplianceEvidence
       │              ├── MonitoringAlert
       │              ├── AuditLog
       │              └── AiSystemScan
       ├── Subscription
       ├── GithubConnection
       ├── UserGithubRepo
       ├── McpApiKey
       ├── GitHubActionInstall
       ├── PRScan
       └── Feedback
```

### Key Models

| Model | Lines | Purpose |
|-------|-------|---------|
| `User` | 36 | Auth user, hub for all data |
| `RepoScan` | 32 | Single GitHub repo scan with all raw data |
| `LlmCapabilityAnalysis` | 31 | AI capability detection results from scanner + LLM |
| `RiskAssessment` | 32 | Annex III risk classification |
| `FinalRiskAssessment` | 34 | Post-context-verification final assessment |
| `ComplianceReport` | 24 | Generated PDF reports with digital signatures |
| `AiSystem` | 37 | AI System Registry entry (links scans) |
| `Subscription` | 32 | Pro/Enterprise tier, Dodo Payments fields |
| `ConformityAssessment` | 27 | Module A/B+C pathway tracking with step data |
| `AuditLog` | 19 | Tamper-proof hash-chained compliance action logging |
| `ComplianceEvidence` | 25 | Evidence collection with integrity hashing |
| `RegulatoryUpdate` | 21 | EU AI Act amendments tracking |
| `McpApiKey` | 13 | MCP server API key management (SHA-256 hashed) |

### Database Features

- **PostgreSQL** hosted on Supabase
- **Row-Level Security (RLS)** policies in `rls_policies.sql`
- **Cascade deletes** on all user-owned data
- **Indexed fields** for performance-critical queries (30+ indexes)
- **Timestamptz** for all datetime fields (timezone-aware)
- **JSON columns** for flexible schema (capabilities, risk indicators, evidence, etc.)
- **Unique constraints** on composite keys (user + repo, user + AI system name, etc.)

---

## 7. Security Architecture

### 7.1 Authentication (`middleware.ts`)

- **Supabase SSR** (`@supabase/ssr`) with cookie-based session management
- Session refresh on every request via `getUser()`
- `/dashboard/*` routes redirect to `/auth/login` if unauthenticated
- Auth pages redirect to `/dashboard/scanner` if already logged in
- Pattern: `createServerClient()` in each API route for server-side auth

### 7.2 Encryption (`encryption.ts`)

- **AES-256-GCM** for GitHub OAuth tokens
- Format: `iv:authTag:ciphertext` (hex-encoded)
- Key derived from `ENCRYPTION_KEY` env var via SHA-256

### 7.3 Rate Limiting (`rateLimit.ts`)

| Action | Window | Max Requests |
|--------|--------|:---:|
| `REPO_SCAN` | 1 hour | 10 |
| `REPO_LIST` | 1 hour | 30 |
| `LLM_ANALYSIS` | 1 hour | 20 |
| `ANONYMOUS_SCAN` | 24 hours | 1 |

- **Primary**: Upstash Redis (atomic `INCR` + `EXPIRE`)
- **Fallback**: In-memory `Map` (for development/Redis outage)
- Returns `429` with `Retry-After` header

### 7.4 Audit Logging (`audit-logger.ts`)

- **Hash-chained** audit log entries (tamper-proof)
- Records: action, entity type/ID, description, metadata, IP, user agent
- Previous hash linked for chain integrity

### 7.5 HTTP Security Headers (`next.config.ts`)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [comprehensive policy]
```

### 7.6 Guardian Agent (`guardian-agent.ts`)

Security guardian module for detecting and mitigating threats (4.7KB).

### 7.7 Tripwire Detection (`tripwire.ts`)

Security tripwire system for detecting unauthorized access patterns (6.7KB).

---

## 8. Enterprise Multi-Tenancy (White-Label for Law Firms)

Lexoculus includes an optional multi-tenancy layer designed for law firms and compliance consultants to manage multiple clients.

### 8.1 Multi-Tenancy Models

| Model | Purpose |
|-------|---------|
| `Firm` | Represents a law firm or consulting entity. Supports custom branding (logo, intro text). |
| `FirmMember` | Links users to a `Firm` with specific roles (e.g., `admin`, `member`). |
| `FirmClient` | Represents a client of the firm. Enables tracking of client-specific repositories and scans. |
| `FirmClientAccess` | Manages GitHub OAuth tokens granted by clients to the firm for automated monitoring. |

### 8.2 Client Monitoring Workflow

1. **Firm** creates a **FirmClient** entry.
2. **Client** provides a delegated GitHub OAuth token via a secure onboarding link.
3. **Lexoculus** uses the token to scan and monitor the client's repositories on behalf of the Firm.
4. **Firm** generates branded compliance reports for the Client using the Firm's white-label settings.

---

## 9. API Architecture (41 Endpoints)

### Core Scan Pipeline

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/scan-repo` | POST | Auth | Scan GitHub repo via authenticated GitHub API |
| `/api/analyze-capabilities` | POST | Auth or `scan_token` | Run hybrid scanner + LLM analysis |
| `/api/classify-risk` | POST | Auth or `scan_token` | Risk classification with constraint engine |
| `/api/context-questions` | GET | Auth | Generate context verification questions |
| `/api/verify-context` | POST | Auth | Submit context answers |
| `/api/final-risk-assessment` | POST | Auth | Generate final assessment |
| `/api/generate-report` | POST | Auth | Generate PDF compliance report |

### Anonymous Flow

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `/api/anonymous-scan` | None (IP) | Scan public repos, return `scan_token` |
| `/api/claim-scan` | Auth | Transfer anonymous scan to authenticated user |

### AI System Registry

| Endpoint | Purpose |
|----------|---------|
| `/api/ai-systems/` | CRUD for AI systems |
| `/api/conformity-assessment/[ai_system_id]` | Conformity assessment pathway |
| `/api/compliance-timeline/[ai_system_id]` | Staggered deadlines (Article 113) |
| `/api/documents/` | Auto-generated compliance documents |

### Reports & Evidence

| Endpoint | Purpose |
|----------|---------|
| `/api/reports/` | Report management |
| `/api/audit-logs`, `/api/audit-export` | Audit log access and export |
| `/api/evidence`, `/api/upload-evidence` | Evidence management (chain of custody) |

### GitHub Integration

| Endpoint | Purpose |
|----------|---------|
| `/api/github/` | GitHub API operations |
| `/api/badge` | SVG compliance badge generation |
| `/api/webhooks` | GitHub webhook handler (PR scanning) |

### Platform

| Endpoint | Purpose |
|----------|---------|
| `/api/subscription/checkout` | Dodo Payments checkout |
| `/api/webhooks/dodo` | Dodo Payments webhook (subscription lifecycle) |
| `/api/admin` | Admin operations (email-gated) |
| `/api/user/export` | User data export |
| `/api/mcp`, `/api/mcp-status` | MCP server integration |

---

## 10. Payment System (Dodo Payments)

| Feature | Detail |
|---------|--------|
| **Provider** | Dodo Payments (`dodopayments` SDK v2.19) |
| **Currency** | EUR only (single currency, B2B focus) |
| **Pro Monthly** | €99/month |
| **Pro Yearly** | €999/year |
| **Enterprise** | Custom pricing (contact form) |
| **Checkout** | `createCheckoutSession()` → Dodo hosted checkout |
| **Webhook Events** | `subscription.active`, `subscription.failed`, `subscription.cancelled`, `subscription.expired` |
| **Failure Handling** | Failed/expired → immediate revocation (`past_due`); Cancelled → grace period |
| **Success Flow** | Polling (2s interval, max 30s) to verify activation before redirect |
| **Portal** | Customer portal via `dodo.customers.customerPortal.create()` |

### Subscription Tiers

| Tier | Repos | Scans | PR Scans | Reports | Features |
|------|:-----:|:-----:|:--------:|:-------:|----------|
| **Unpaid** | 0 | 0 | 0 | 0 | None |
| **Pro** | ∞ | ∞ | ∞ | 100 | GitHub Action, Slack, PDF, API, Priority Support |
| **Enterprise** | ∞ | ∞ | ∞ | ∞ | All Pro + custom constraints, 999-member teams |

---

## 11. MCP Server Architecture

A **standalone** MCP (Model Context Protocol) server for AI coding assistants, separate from the main Next.js app.

| Component | Detail |
|-----------|--------|
| **Package** | `lexoculus-mcp-server` |
| **SDK** | `@modelcontextprotocol/sdk` v1.12 |
| **Language** | TypeScript (separate `tsconfig.json`) |
| **Validation** | Zod v3.24 |
| **Entry** | `mcp-server/src/index.ts` |
| **Structure** | `src/tools/` (tool handlers), `src/resources/` (resource providers) |
| **API Keys** | SHA-256 hashed, stored in `McpApiKey` model, prefix display (`lx_...`) |

---

## 12. Frontend Architecture

### Design System: "Optical Legality" (System 3.0)

| Property | Value |
|----------|-------|
| **Aesthetic** | Brutalist, sharp, legal-grade |
| **Serif Font** | Times-Roman (headings) |
| **Mono Font** | Courier (data, labels) |
| **Primary** | Black `#000` |
| **Accent** | Safety Orange `#FF4F00` |
| **Grey** | `#555` / `#999` |
| **Borders** | Sharp, no rounded corners |
| **Labels** | `font-mono text-[10px] uppercase tracking-widest` |

### Route Map

#### Public (Unauthenticated)

| Route | Purpose |
|-------|---------|
| `/` | Landing page with inline HeroScanForm |
| `/scan/[id]` | Public scan results (auto-pipeline) |
| `/auth/login`, `/auth/signup` | Authentication |
| `/pricing` | Pricing page |
| `/legal/*` | Compliance, Privacy, Security, Terms |

#### Dashboard (Authenticated)

| Route | Pipeline Stage |
|-------|---------------|
| `/dashboard/scanner` | Stage 1: GitHub repo scanner |
| `/dashboard/analyzer/[id]` | Stage 2: AI capability analysis |
| `/dashboard/risk-classifier/[id]` | Stage 3: Risk classification + GPAI |
| `/dashboard/context-verifier/[id]` | Stage 4: Context verification |
| `/dashboard/report/[id]` | Stage 5: Compliance report |
| `/dashboard/registry` | AI System Registry |
| `/dashboard/documents/[ai_system_id]` | Compliance documents |
| `/dashboard/conformity/[id]` | Conformity assessment tracker |
| `/dashboard/timeline` | Compliance timeline (Article 113) |
| `/dashboard/integrations` | GitHub Action CI setup |

### Components (35 total)

#### Custom Components (20)

`OpticalLogo`, `OpticalTypeScanner`, `BetaBanner`, `RepoSelector`, `ScanStatus`, `CapabilityCard`, `RiskClassificationCard`, `FinalAssessmentCard`, `RiskScoreGauge`, `ConfidenceBadge`, `QuestionSet`, `QuestionFileUpload`, `ReportDownloadCard`, `GitHubConnectButton`, `GitHubActionSetupModal`, `FeedbackWidget`, `MarkdownEditor`, `MobileDesktopSuggestion`, `StorageStatus`, `UpgradePrompt`

#### Radix UI Primitives (15)

`Alert`, `Badge`, `Button`, `Card`, `Dialog`, `Input`, `Label`, `Progress`, `RadioGroup`, `Select`, `Separator`, `Sheet`, `Table`, `Tabs`, `Textarea`

---

## 13. GitHub Integration

### CI/CD — GitHub Action PR Scanner

- Model: `GitHubActionInstall` + `PRScan`
- Uses `quickPatternMatch()` for fast, LLM-free PR scanning
- Configurable: `block_on_high_risk`, `block_on_unacceptable`
- Optional Slack webhook notifications
- SVG compliance badge generation

### GitHub API

| Module | Purpose |
|--------|---------|
| `github.ts` (13.8KB) | Authenticated GitHub operations (repo listing, file tree, content fetching) |
| `github-public.ts` | Public repo data via REST API (no auth) — used by anonymous scan |
| `github-security.ts` | GitHub security utilities |

---

## 14. Infrastructure

### Logging (`logger.ts`)

- **Pino** structured JSON logger
- Production-level logging with configurable levels

### Storage (`storage.ts`, 7.2KB)

- **Supabase Storage** for evidence uploads, compliance documents
- Storage quota tracking per user

### Prisma Client (`prisma.ts`)

- Singleton pattern with `globalThis` caching for serverless
- PostgreSQL driver via `@prisma/adapter-pg`

### Supabase Clients

| Client | File | Purpose |
|--------|------|---------|
| Server-side | `supabase-server.ts` | Creates Supabase client with service role key |
| Client-side | `supabase.ts` | Browser-side Supabase client |

---

## 15. Environment Variables

```env
# ─────────────────────────────────────────────
# LEXOCULUS — Environment Variables
# ─────────────────────────────────────────────

# ── App ──────────────────────────────────────
NEXT_PUBLIC_APP_URL=       # Your public URL

# ── Database (Supabase PostgreSQL) ───────────
DATABASE_URL=              # Connection string
DIRECT_URL=                # Direct DB URL

# ── Supabase Auth ────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ── GitHub OAuth ─────────────────────────────
GITHUB_APP_CLIENT_ID=
GITHUB_APP_CLIENT_SECRET=

# ── AI / LLM ─────────────────────────────────
GROQ_API_KEY=
GROQ_MODEL=                # Default: llama-3.3-70b-versatile

# ── Security ─────────────────────────────────
ENCRYPTION_KEY=            # AES-256-GCM key
ADMIN_EMAIL=               # Admin panel gate

# ── Rate Limiting (Upstash Redis) ────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ── Payments (Dodo Payments) ─────────────────
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_PRODUCT_ID_PRO=
DODO_PAYMENTS_PRODUCT_ID_PRO_YEARLY=
DODO_PAYMENTS_WEBHOOK_SECRET=

# ── Email (SMTP) ──────────────────────────────
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
LEADS_EMAIL=               # Lead notification target

# ── Security Webhooks ─────────────────────────
GITHUB_WEBHOOK_SECRET=
DRIFT_WEBHOOK_SECRET=
CRON_SECRET=
```

---

## 16. Testing & Development

### Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | `prisma generate && next build` |
| `npm run test` | Jest unit tests |
| `npm run lint` | ESLint |
| `npm run mcp` | Start MCP server (`npx tsx mcp-server/src/index.ts`) |
| `npx tsc --noEmit` | TypeScript strict check (**must pass before deploy**) |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma db push` | Push schema to DB |
| `npx prisma migrate dev` | Formal migrations |

### TypeScript Configuration

```json
{
  "target": "ES2017",
  "strict": true,
  "module": "esnext",
  "moduleResolution": "bundler",
  "jsx": "react-jsx",
  "incremental": true,
  "paths": { "@/*": ["./src/*"] }
}
```

### Jest Configuration

- Test runner: `ts-jest` with `jsdom` environment
- Tests location: `__tests__/unit/`
- Mock library: `node-mocks-http`

---

## 17. Deployment

| Aspect | Detail |
|--------|--------|
| **Platform** | Vercel |
| **Analytics** | `@vercel/analytics` v1.6 |
| **Build** | `prisma generate && next build` |
| **Bundler** | Turbopack (Next.js 16 default) |
| **External Packages** | PDFKit externalized for API routes |
| **Region** | Vercel's default edge/serverless |

---

## 18. File Size Census (Core Modules)

| File | Size | Lines |
|------|------|:-----:|
| `annex-iii-articles.ts` | 47.3KB | ~1200 |
| `risk-classifier.ts` | 44.2KB | 1018 |
| `dependency-scanner.ts` | 38.2KB | 1084 |
| `ai-library-database.ts` | 38.7KB | ~1000 |
| `pdf-generator.ts` | 30.8KB | ~800 |
| `context-refiner.ts` | 28.9KB | 770 |
| `conformity-assessment.ts` | 26.2KB | 573 |
| `gpai-classifier.ts` | 23.6KB | 599 |
| `schema.prisma` | 25.1KB | 573 |
| `groq.ts` | 21.0KB | 568 |
| `context-questions.ts` | 20.4KB | ~550 |
| `constraint-engine.ts` | 18.2KB | 539 |
| `document-generator.ts` | 14.5KB | ~400 |
| `subscription.ts` | 14.7KB | 418 |
| `compliance-timeline.ts` | 10.8KB | ~300 |
| `email.ts` | 12.8KB | ~350 |

**Total core engine**: ~400KB+ of TypeScript business logic across 31+ modules.
