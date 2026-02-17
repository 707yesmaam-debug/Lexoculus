# LexOculus — Master Agent Context

> **Last updated**: 2026-02-17 by Antigravity agent session `e0f71fad`
> **Purpose**: Onboarding document for the next AI agent instance. Read this FIRST before making any changes.

---

## 1. What Is This Project?

**LexOculus** (repo: `complianceAI`) is a **EU AI Act compliance platform** built with Next.js. It scans GitHub repositories to detect AI capabilities, classifies risk under the EU AI Act, and generates compliance reports.

**Target users**: Developers and companies deploying AI systems in the EU who need to understand their regulatory obligations.

**Live URL**: Deployed on Vercel (production).

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript (strict) |
| Runtime | React 19.2.3 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7.2.0 |
| Auth | Supabase Auth (email + GitHub OAuth) |
| AI/LLM | Groq API (Llama models) |
| Styling | Vanilla CSS + Tailwind (v4) + custom design system |
| Animations | Framer Motion 12.x |
| 3D | Three.js 0.182 + React Three Fiber 9.x + Drei 10.x |
| UI Primitives | Radix UI (Dialog, Select, Tabs, Progress, Radio, Label, Separator) |
| Forms | React Hook Form + Zod validation |
| Rate Limiting | Upstash Redis (with in-memory fallback) |
| PDF | PDFKit 0.17 |
| Logging | Pino |
| Payments | Dodo Payments (Subscription & One-time) |
| Deployment | Vercel + Vercel Analytics |

### Design System: "Optical Legality" (System 3.0)
- **Fonts**: Times-Roman (serif headings), Courier/mono (data/labels)
- **Colors**: Black `#000`, Safety Orange `#FF4F00`, Grey `#555`/`#999`
- **Style**: Sharp borders, no rounded corners, uppercase monospace labels, brutalist aesthetic
- **Pattern**: `font-mono text-[10px] uppercase tracking-widest` for labels

---

## 3. Core Architecture — The Scan Pipeline

The platform follows a **5-stage sequential pipeline**. Each stage has its own API route and lib module:

```
1. SCANNER → 2. LLM ANALYSIS → 3. RISK CLASSIFICATION → 4. CONTEXT VERIFICATION → 5. REPORT
```

### Stage Details

| Stage | Lib Module | API Route | Dashboard Page |
|-------|-----------|-----------|----------------|
| 1. Scan GitHub repo | `dependency-scanner.ts` | `/api/scan-repo` | `/dashboard/scanner` |
| 2. AI capability analysis | `ai-library-database.ts` | `/api/analyze-capabilities` | `/dashboard/analyzer/[id]` |
| 3. Risk classification | `risk-classifier.ts` + `gpai-classifier.ts` | `/api/classify-risk` | `/dashboard/risk-classifier/[id]` |
| 4. Context verification | `context-questions.ts` + `context-refiner.ts` | `/api/context-questions` | `/dashboard/context-verifier/[id]` |
| 5. Final report | `pdf-generator.ts` | `/api/reports` | `/dashboard/report/[id]` |

### Anonymous Scan Pipeline (Added Feb 16, 2026)

A parallel **zero-signup flow** for public repos:

```
Landing Page → /api/anonymous-scan → /scan/[id] (auto-triggers analyze + classify) → Auth Gate → Signup → /api/claim-scan
```

- No account required for scanning, analysis, and risk classification
- Context verification is **gated behind account creation**
- Uses `scan_token` (UUID) for anonymous ownership
- Results auto-delete after 7 days if unclaimed

### Key Lib Modules (src/lib/)

| File | Purpose |
|------|---------| 
| `dependency-scanner.ts` | Scans GitHub repos for AI libraries via GitHub API |
| `ai-library-database.ts` | Database of 200+ AI libraries with capability mappings |
| `risk-classifier.ts` | Maps capabilities → Annex III articles → risk classification |
| `gpai-classifier.ts` | Detects GPAI model usage (OpenAI, Anthropic, etc.), determines provider/deployer/systemic risk |
| `annex-iii-articles.ts` | EU AI Act Annex III article definitions + constraints |
| `constraint-engine.ts` | Constraint validation engine |
| `conformity-assessment.ts` | Module A/B+C conformity pathway determination |
| `compliance-timeline.ts` | Article 113 staggered deadlines with status calculation |
| `context-questions.ts` | Context verification question generation |
| `context-refiner.ts` | Refines context verification answers |
| `document-generator.ts` | Compliance document generation |
| `github-public.ts` | **Used by anonymous scan** — Fetches public repo data via GitHub REST API (no auth token required) |
| `github.ts` | Authenticated GitHub API interactions |
| `github-security.ts` | GitHub security utilities |
| `groq.ts` | Groq LLM client wrapper |
| `rateLimit.ts` | Rate limiting (Redis + in-memory fallback). Includes `ANONYMOUS_SCAN` config (1/IP/day) |
| `pdf-generator.ts` | Compliance report PDF generation (PDFKit) |
| `report-signer.ts` | Report cryptographic signing |
| `audit-logger.ts` | Structured audit logging |
| `encryption.ts` | AES-256-GCM encryption for tokens |
| `storage.ts` | Supabase Storage operations |
| `subscription.ts` | Subscription tier management (Dodo Payments integration) |
| `dodo.ts` | Dodo Payments SDK client |
| `pricing-config.ts` | Pricing tier configuration |
| `tripwire.ts` | Security tripwire detection |
| `admin.ts` | Admin operations |
| `users.ts` | User operations |
| `supabase-server.ts` | Server-side Supabase client |
| `supabase.ts` | Client-side Supabase client |
| `prisma.ts` | Prisma client singleton |
| `logger.ts` | Pino logger configuration |
| `utils.ts` | General utilities |
| `document-templates/` | 5 compliance document templates |

---

## 4. Database Schema (Prisma)

**Schema file**: `prisma/schema.prisma` (809 lines, 17 models)

### Key Models

| Model | Purpose | 
|-------|---------| 
| `User` | Auth user, linked to all data |
| `GithubConnection` | GitHub OAuth connections (encrypted tokens) |
| `RepoScan` | A single scan of a GitHub repo. Has `scan_token` (nullable, unique) for anonymous scans |
| `UserGithubRepo` | Cached user GitHub repos |
| `LlmCapabilityAnalysis` | AI capability detection results |
| `RiskAssessment` | Annex III risk classification |
| `FinalRiskAssessment` | Post-context-verification final assessment |
| `ComplianceReport` | Generated PDF reports |
| `GitHubActionInstall` | GitHub Action CI integration |
| `PRScan` | Individual PR scan results |
| `Subscription` | Pro/Free tier + generic payment fields (`payment_provider`, `payment_customer_id`) |
| `Feedback` | User feedback (1-5 rating) |
| `AiSystem` | AI System Registry entry (links to scans) |
| `AiSystemScan` | Scan history per AI system |
| `ComplianceDocument` | Auto-generated EU AI Act documents |
| `MonitoringAlert` | Alert system for compliance events |
| `AuditLog` | Tamper-proof compliance action logging |
| `ComplianceEvidence` | Evidence collection and chain of custody |
| `RegulatoryUpdate` | EU AI Act amendments and guidance tracking |
| `ConformityAssessment` | Conformity pathway tracking (Module A/B+C/D/F) |

### Relations Pattern
```
User → AiSystem → RepoScan → LlmCapabilityAnalysis → RiskAssessment → FinalRiskAssessment
                           → ConformityAssessment
```

### Anonymous User
A dedicated system user `anonymous-system-user-0000` (email: `system@lexoculus.com`) owns all anonymous scans. This avoids making `user_id` nullable — anonymous scans are simply owned by this system user until claimed.

---

## 5. API Endpoints (38 Total)

### Core Scan Pipeline
| Endpoint | Auth | Purpose |
|----------|------|---------|
| `/api/scan-repo` | Authenticated | Scan GitHub repo |
| `/api/analyze-capabilities` | Auth or `scan_token` | LLM capability analysis |
| `/api/classify-risk` | Auth or `scan_token` | Risk classification |
| `/api/context-questions` | Authenticated | Context verification questions |
| `/api/verify-context` | Authenticated | Submit context answers |
| `/api/final-risk-assessment` | Authenticated | Final risk assessment |
| `/api/final-risk-assessments` | Authenticated | List final assessments |
| `/api/generate-report` | Authenticated | Generate PDF report |

### Anonymous Flow
| Endpoint | Auth | Purpose |
|----------|------|---------|
| `/api/anonymous-scan` | None (IP rate-limited) | Scan public repo, return `scan_token` |
| `/api/claim-scan` | Authenticated | Transfer anonymous scan ownership |
| `/api/public-scan` | None | Public scan data retrieval |

### AI System Registry & Compliance
| Endpoint | Purpose |
|----------|---------|
| `/api/ai-systems/` | CRUD for AI systems |
| `/api/conformity-assessment/[ai_system_id]` | Conformity assessment |
| `/api/compliance-timeline/[ai_system_id]` | Timeline data |
| `/api/documents/` | Compliance documents |
| `/api/annex-iii-articles` | Annex III article data |

### Reports & Evidence
| Endpoint | Purpose |
|----------|---------|
| `/api/reports/` | Report management |
| `/api/capability-analysis` | Capability data |
| `/api/risk-assessment` | Risk assessment data |
| `/api/risk-assessments` | List assessments |
| `/api/repo-scans` | Scan listing |
| `/api/audit-export` | Audit data export |
| `/api/audit-logs` | Audit log access |
| `/api/evidence` | Evidence management |
| `/api/upload-evidence` | Evidence upload |
| `/api/storage-quota` | Storage usage |

### GitHub Integration
| Endpoint | Purpose |
|----------|---------|
| `/api/github/` | GitHub operations |
| `/api/badge` | Compliance badge |
| `/api/webhooks` | GitHub webhooks |

### Platform
| Endpoint | Purpose |
|----------|---------|
| `/api/auth/` | Auth operations |
| `/api/subscription/checkout` | Dodo Payments checkout session creation |
| `/api/webhooks/dodo` | Dodo Payments webhook handler |
| `/api/subscription/` | Subscription management |
| `/api/admin` | Admin operations |
| `/api/alerts` | Alert management |
| `/api/escalate-review` | Manual review escalation |
| `/api/feedback` | Feedback submission |
| `/api/llm-health` | LLM health check |
| `/api/regulatory-updates` | Regulatory update tracking |
| `/api/repo` | Repo data |
| `/api/status` | System status |

---

## 6. Recent Changes

### Session `e0f71fad` — Feb 17, 2026: Payment Integration & B2B Gating ✅

**Goal**: Complete the payment flow, enforce single-currency (EUR) B2B pricing, and ensure robust handling of payment success/failure.

#### Key Implementation Details
- **Single Pricing**: Standardized to **€99/month** (PRO) & **€999/year**. Removed regional pricing/currency switching.
- **Data Model**: `Subscription` table updated to handle Dodo Payments fields (`payment_customer_id`, `payment_subscription_id`).
- **Safe Landing Flow**:
  - `SubscriptionGate.tsx` now handles `?checkout=success`.
  - Implements **polling (2s interval, max 30s)** to verify subscription activation before redirecting, fixing race conditions.
  - Shows "Finalizing Setup" loading state.
- **Failure Handling**:
  - `src/app/api/webhooks/dodo/route.ts`:
    - `subscription.failed` / `expired`: **Immediate Revocation** (`status: past_due`).
    - `subscription.cancelled` (User): **Grace Period** (access until period end).
  - Checkout Cancellation: Redirects to `/pricing` (NOTE: `cancel_url` removed from SDK call as it is currently unsupported by `dodopayments` node SDK).
- **UI Updates**:
  - Pricing Page: "Purchase License" CTAs (B2B focus).
  - Dashboard Layout: Wrapped `SubscriptionGate` in `Suspense` to fix build error.

#### Modified Files
- `src/lib/subscription.ts` (Pricing config, polling logic)
- `src/app/api/webhooks/dodo/route.ts` (Failure logic)
- `src/components/SubscriptionGate.tsx` (Polling & Suspense)
- `src/app/pricing/page.tsx` (UI/CTAs)

### Session `ec2889d3` — Feb 16, 2026: Zero-Signup Scan Flow ✅

**Goal**: Allow users to scan public repos without creating an account. Gate context verification behind signup.

#### New API Endpoints
| Endpoint | Auth | Purpose |
|----------|------|---------|
| `/api/anonymous-scan` | None (IP rate-limited) | Scan public repo, return `scan_token` |
| `/api/claim-scan` | Authenticated | Transfer anonymous scan ownership after signup |

#### Modified API Endpoints
| Endpoint | Change |
|----------|--------|
| `/api/analyze-capabilities` | Accepts `scan_token` as alternative auth for anonymous flow |
| `/api/classify-risk` | Accepts `scan_token` as alternative auth for anonymous flow |

Both modified endpoints use `effectiveUserId = user?.id || 'anonymous-system-user-0000'` pattern.

#### New Frontend Pages
| Page | Purpose |
|------|---------|
| `/scan/[id]/page.tsx` | Public results page — auto-triggers analyze + classify, shows results, auth gate at context verification |

#### Modified Frontend
| File | Change |
|------|--------|
| `src/app/page.tsx` | Hero section: replaced CTA buttons with `HeroScanForm` — inline GitHub URL input + "Scan_Now" button |

#### Schema Changes
| Change | Details |
|--------|---------|
| `RepoScan.scan_token` | `String? @unique` — UUID token for anonymous scan ownership |
| `ANONYMOUS_SCAN` rate limit | 1 scan per IP per 24h, in `rateLimit.ts` |

#### Key Implementation Details
- Anonymous scans set `expires_at` to 7 days (vs 30 days for authenticated)
- `scan_token` stored in `localStorage` (`anon_scan_token`, `anon_scan_id`, `anon_scan_expires`)
- `/scan/[id]` page auto-runs full pipeline using token, shows progressive loading UI
- `claim-scan` updates `RepoScan`, `LlmCapabilityAnalysis`, `RiskAssessment` user IDs, creates `AiSystem` entry

### Session `56a64ba8` — Feb 15, 2026: Landing Page Redesign + Earlier Features

#### Landing Page
- Full-width hero with "Optical Legality" design system
- Risk assessment mockup on right panel with animated scan line
- Pipeline visualization section ("How It Works")
- Feature cards, EU AI Act compliance section, CTA footer

#### Earlier Features (Sessions prior to Feb 15)
- **GPAI Classification Engine** — `gpai-classifier.ts`, 10-provider detection
- **Conformity Assessment Tracker** — Module A/B+C pathway, `conformity-assessment.ts`
- **Implementation Timeline** — Article 113 deadlines, `compliance-timeline.ts`
- **UI Fixes** — Timeline sidebar nav, GPAI tooltips, info badges

---

## 7. Sidebar Navigation

Defined in `src/app/dashboard/layout.tsx`:

```
01_SCANNER    → /dashboard/scanner
02_ANALYSIS   → /dashboard/analyzer/{scan_id}
03_REPORTS    → [PRO]
04_REGISTRY   → /dashboard/registry
05_INTEGRATIONS → [PRO]
06_TIMELINE   → /dashboard/timeline
```

Locking logic: Active scan locks SCANNER, REGISTRY, and TIMELINE to keep user focused.

---

## 8. Frontend Routes

### Public (Unauthenticated)
| Route | Purpose |
|-------|---------|
| `/` | Landing page with inline scan form |
| `/scan/[id]` | Public scan results (auto-pipeline, auth gate at context verification) |
| `/auth/login` | Login page |
| `/auth/signup` | Signup page |
| `/pricing` | Pricing page |
| `/status/[shareId]` | Shared status page |
| `/legal/compliance` | Compliance policy |
| `/legal/privacy` | Privacy policy |
| `/legal/security` | Security policy |
| `/legal/terms` | Terms of service |

### Authenticated (Dashboard)
| Route | Purpose |
|-------|---------|
| `/dashboard` | Dashboard home |
| `/dashboard/scanner` | Step 1: GitHub repo scanner |
| `/dashboard/analyzer/[id]` | Step 2: AI capability analysis |
| `/dashboard/risk-classifier/[id]` | Step 3: Risk classification + GPAI panel |
| `/dashboard/context-verifier/[id]` | Step 4: Context verification |
| `/dashboard/report/[id]` | Step 5: Compliance report |
| `/dashboard/registry` | AI System Registry |
| `/dashboard/documents/[ai_system_id]` | Compliance documents per AI system |
| `/dashboard/conformity/[id]` | Conformity assessment tracker |
| `/dashboard/timeline` | Compliance timeline dashboard |
| `/dashboard/integrations` | GitHub Action integrations |
| `/dashboard/free-scanner` | Free scanner page |

### Admin
| Route | Purpose |
|-------|---------|
| `/admin` | Admin panel (email-gated) |

---

## 9. Components

### Custom Components (src/components/)
| Component | Purpose |
|-----------|---------|
| `OpticalLogo.tsx` | Animated logo |
| `OpticalTypeScanner.tsx` | Scan animation effect |
| `BetaBanner.tsx` | Beta status banner |
| `RepoSelector.tsx` | GitHub repo selection |
| `ScanStatus.tsx` | Scan progress display |
| `CapabilityCard.tsx` | AI capability results |
| `RiskClassificationCard.tsx` | Risk classification display |
| `FinalAssessmentCard.tsx` | Final assessment results |
| `RiskScoreGauge.tsx` | Visual risk gauge |
| `ConfidenceBadge.tsx` | Confidence level badge |
| `QuestionSet.tsx` | Context verification questions |
| `QuestionFileUpload.tsx` | File upload for questions |
| `ReportDownloadCard.tsx` | Report download UI |
| `GitHubConnectButton.tsx` | GitHub OAuth connection |
| `GitHubActionSetupModal.tsx` | GitHub Action setup modal |
| `FeedbackWidget.tsx` | User feedback collection |
| `MarkdownEditor.tsx` | Markdown editor |
| `MobileDesktopSuggestion.tsx` | Mobile-to-desktop prompt |
| `StorageStatus.tsx` | Storage quota display |
| `UpgradePrompt.tsx` | Pro upgrade prompt |

### UI Primitives (src/components/ui/) — 15 components
Radix-based: `alert`, `badge`, `button`, `card`, `dialog`, `input`, `label`, `progress`, `radio-group`, `select`, `separator`, `sheet`, `table`, `tabs`, `textarea`

---

## 10. Environment Variables

Required in `.env.local`:
```
DATABASE_URL=              # Supabase PostgreSQL connection string
DIRECT_URL=                # Direct DB URL (for Prisma migrations)
NEXT_PUBLIC_SUPABASE_URL=  # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY= # Server-side Supabase key
GROQ_API_KEY=              # Groq LLM API key
GITHUB_APP_CLIENT_ID=      # GitHub OAuth app
GITHUB_APP_CLIENT_SECRET=
ADMIN_EMAIL=               # Admin panel access
UPSTASH_REDIS_REST_URL=    # Rate limiting (optional — falls back to in-memory)
UPSTASH_REDIS_REST_TOKEN=  # Rate limiting token
DODO_PAYMENTS_API_KEY=     # Dodo Payments API Key (Test/Live)
DODO_PAYMENTS_PRODUCT_ID_PRO= # Product ID for Pro tier
DODO_PAYMENTS_WEBHOOK_SECRET= # Webhook signing secret
```

---

## 11. Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npx tsc --noEmit     # TypeScript check (MUST pass before pushing)
npx jest             # Run tests (unit tests in __tests__/unit/)
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma db push   # Push schema to DB (preferred for quick dev updates)
npx prisma migrate dev --name <name>  # Apply formal migrations
```

---

## 12. Critical Rules for Agent

1. **ADDITIVE-ONLY CHANGES** — Never modify existing function signatures or delete code. Only add new code alongside existing code.
2. **Design system** — Use the Optical Legality system: mono labels, serif headings, `#FF4F00` accent, sharp borders, no rounded corners.
3. **TypeScript strict** — Always run `npx tsc --noEmit` before committing. Zero errors required.
4. **Test regression** — Run `npx jest` to verify tests pass after changes.
5. **Prisma workflow** — After modifying `schema.prisma`: run `npx prisma generate`, provide SQL for manual DB updates OR `npx prisma db push`.
6. **Auth pattern** — Most API routes use `createServerClient()` from `@/lib/supabase-server`. Anonymous endpoints (`/api/anonymous-scan`) skip auth but validate `scan_token` or use IP-based rate limiting.
7. **Font-mono labels** — UI labels use `font-mono text-[10px] uppercase tracking-widest` pattern.
8. **Anonymous user constant** — `ANONYMOUS_USER_ID = 'anonymous-system-user-0000'` is used across `anonymous-scan`, `claim-scan`, `analyze-capabilities`, and `classify-risk`.

---

## 13. Pending / Known Issues

- [ ] **Signup flow claim integration**: The signup page (`/auth/signup`) doesn't yet automatically call `/api/claim-scan` after successful registration. Needs `localStorage` check for `anon_scan_token` + API call on auth callback.
- [ ] **Free-scanner stale copy**: `free-scanner/page.tsx` line 139 says "2 Scans / Month" — should be "1 Scan / Month".
- [ ] **03_REPORTS and 05_INTEGRATIONS**: Still marked `[PRO]` / locked in sidebar.
- [ ] **GPAI panel only shows if GPAI detected**: If a repo doesn't use any known AI provider, the panel is hidden (by design).
- [ ] **Timeline page AI system dropdown**: Requires registered AI systems to filter.

---

## 14. File Structure (Key Directories)

```
complianceAI/
├── prisma/
│   ├── schema.prisma          # Database schema (809 lines, 17+ models)
│   └── *.sql                  # 8 SQL migration/policy files
├── src/
│   ├── app/
│   │   ├── api/               # 38 API endpoint directories
│   │   │   ├── anonymous-scan/   # Unauthenticated scan endpoint
│   │   │   ├── claim-scan/       # Transfer anon scan to user
│   │   │   ├── analyze-capabilities/  # Accepts scan_token
│   │   │   ├── classify-risk/    # Accepts scan_token
│   │   │   ├── conformity-assessment/[ai_system_id]/
│   │   │   ├── compliance-timeline/[ai_system_id]/
│   │   │   ├── scan-repo/        # GitHub scanning (authenticated)
│   │   │   └── ... (35 more)
│   │   ├── scan/
│   │   │   └── [id]/page.tsx     # Public results page (no auth)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx        # Sidebar + nav
│   │   │   ├── scanner/          # Step 1
│   │   │   ├── analyzer/[id]/    # Step 2
│   │   │   ├── risk-classifier/[id]/  # Step 3 + GPAI panel
│   │   │   ├── context-verifier/[id]/ # Step 4
│   │   │   ├── report/[id]/      # Step 5
│   │   │   ├── registry/         # AI System Registry
│   │   │   ├── documents/[ai_system_id]/ # Compliance docs
│   │   │   ├── conformity/[id]/  # Conformity tracker
│   │   │   ├── timeline/         # Timeline dashboard
│   │   │   ├── integrations/     # GitHub Action integrations
│   │   │   └── free-scanner/     # Free scanner page
│   │   ├── admin/                # Admin panel
│   │   ├── auth/                 # Login/Signup pages
│   │   ├── legal/                # Compliance, Privacy, Security, Terms
│   │   ├── status/[shareId]/     # Shared status page
│   │   ├── pricing/              # Pricing page
│   │   ├── forbidden/            # 403 page
│   │   └── page.tsx              # Landing page (HeroScanForm)
│   ├── components/               # 20 custom components + 15 UI primitives
│   └── lib/                      # 31 core business logic modules + document-templates/
├── __tests__/unit/               # Jest unit tests (2 test files)
├── public/                       # Static assets (7 files)
├── scripts/                      # Utility scripts
└── AGENT_CONTEXT.md              # This file
```
