# LexOculus — Master Agent Context

> **Last updated**: 2026-02-15 by Antigravity agent session `56a64ba8`
> **Purpose**: Onboarding document for the next AI agent instance. Read this FIRST before making any changes.

---

## 1. What Is This Project?

**LexOculus** (repo: `complianceAI`) is a **EU AI Act compliance platform** built with Next.js. It scans GitHub repositories to detect AI capabilities, classifies risk under the EU AI Act, and generates compliance reports.

**Target users**: Developers and companies deploying AI systems in the EU who need to understand their regulatory obligations.

**Live URL**: Deployed on Vercel (production).

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | Supabase Auth (email + GitHub OAuth) |
| AI/LLM | Groq API (Llama models) |
| Styling | Vanilla CSS + Tailwind-free custom design system |
| PDF | jsPDF |
| Deployment | Vercel |

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
| 4. Context verification | — | `/api/context-questions` | `/dashboard/context-verifier/[id]` |
| 5. Final report | `pdf-generator.ts` | `/api/reports` | `/dashboard/report/[id]` |

### Key Lib Modules (src/lib/)

| File | Purpose |
|------|---------|
| `dependency-scanner.ts` | Scans GitHub repos for AI libraries via GitHub API |
| `ai-library-database.ts` | Database of 200+ AI libraries with capability mappings |
| `risk-classifier.ts` | Maps capabilities → Annex III articles → risk classification |
| `gpai-classifier.ts` | **NEW** — Detects GPAI model usage (OpenAI, Anthropic, etc.), determines provider/deployer/systemic risk |
| `annex-iii-articles.ts` | EU AI Act Annex III article definitions + constraints |
| `conformity-assessment.ts` | **NEW** — Module A/B+C conformity pathway determination |
| `compliance-timeline.ts` | **NEW** — Article 113 staggered deadlines with status calculation |
| `pdf-generator.ts` | Compliance report PDF generation |
| `report-signer.ts` | Report cryptographic signing |
| `supabase-server.ts` | Server-side Supabase client |
| `prisma.ts` | Prisma client singleton |

---

## 4. Database Schema (Prisma)

**Schema file**: `prisma/schema.prisma`

### Key Models

| Model | Purpose |
|-------|---------|
| `User` | Auth user, linked to all data |
| `RepoScan` | A single scan of a GitHub repo |
| `LlmCapabilityAnalysis` | AI capability detection results |
| `RiskAssessment` | Annex III risk classification |
| `FinalRiskAssessment` | Post-context-verification final assessment |
| `ComplianceReport` | Generated PDF reports |
| `AiSystem` | AI System Registry entry (links to scans) |
| `ConformityAssessment` | **NEW** — Conformity pathway tracking (Module A/B+C) |
| `Subscription` | Pro/Free tier |
| `GitHubActionInstall` | GitHub Action CI integration |

### Relations Pattern
```
User → AiSystem → RepoScan → LlmCapabilityAnalysis → RiskAssessment → FinalRiskAssessment
                           → ConformityAssessment
```

---

## 5. Recent Changes (This Session — Feb 2026)

### Feature 1: GPAI Classification Engine ✅
- `src/lib/gpai-classifier.ts` — 10-provider detection database
- Modified `risk-classifier.ts` (added `classifyRiskFull` wrapper)
- Modified `annex-iii-articles.ts` (6 GPAI constraints)
- Modified `/api/classify-risk/route.ts`
- Modified risk-classifier dashboard page (GPAI panel)

### Feature 2: Conformity Assessment Pathway Tracker ✅
- `src/lib/conformity-assessment.ts` — Module A/B+C pathway logic
- `prisma/schema.prisma` — `ConformityAssessment` model
- `src/app/api/conformity-assessment/[ai_system_id]/route.ts` — GET/POST/PATCH
- `src/app/dashboard/conformity/[ai_system_id]/page.tsx` — Dashboard

### Feature 3: Implementation Timeline Dashboard ✅
- `src/lib/compliance-timeline.ts` — Article 113 deadlines
- `src/app/api/compliance-timeline/[ai_system_id]/route.ts` — API
- `src/app/dashboard/timeline/page.tsx` — Timeline dashboard

### UI Fixes ✅
- Added `06_TIMELINE` to sidebar nav (`layout.tsx`)
- Replaced static Info icons with labeled badges + explanations
- Added plain-language GPAI descriptions for non-legal developers

---

## 6. Sidebar Navigation

Defined in `src/app/dashboard/layout.tsx`, lines 98-145:

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

## 7. Environment Variables

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
```

---

## 8. Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npx tsc --noEmit     # TypeScript check (MUST pass before pushing)
npx jest             # Run tests (33 tests, 2 suites)
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # Apply schema migrations
```

---

## 9. Critical Rules for Agent

1. **ADDITIVE-ONLY CHANGES** — Never modify existing function signatures or delete code. Only add new code alongside existing code.
2. **Design system** — Use the Optical Legality system: mono labels, serif headings, `#FF4F00` accent, sharp borders, no rounded corners.
3. **TypeScript strict** — Always run `npx tsc --noEmit` before committing. Zero errors required.
4. **Test regression** — Run `npx jest` to verify 33/33 tests pass after changes.
5. **Prisma workflow** — After modifying `schema.prisma`: run `npx prisma generate`, provide SQL for manual DB updates OR `npx prisma migrate dev`.
6. **Auth pattern** — All API routes use `createServerClient()` from `@/lib/supabase-server` for auth. Always check `user` before proceeding.
7. **Font-mono labels** — UI labels use `font-mono text-[10px] uppercase tracking-widest` pattern.

---

## 10. Pending / Known Issues

- [ ] **Prisma migration not run**: The `ConformityAssessment` table needs to be created in Supabase. SQL was provided to user but may not be applied yet.
- [ ] **03_REPORTS and 05_INTEGRATIONS**: Still marked `[PRO]` / locked in sidebar. Reports exist but need Pro subscription.
- [ ] **GPAI panel only shows if GPAI detected**: If a repo doesn't use any known AI provider, the panel is hidden (by design).
- [ ] **Timeline page AI system dropdown**: Requires registered AI systems to filter. Works with "all" mode by default.

---

## 11. File Structure (Key Directories)

```
complianceAI/
├── prisma/schema.prisma          # Database schema (806 lines)
├── src/
│   ├── app/
│   │   ├── api/                  # API routes
│   │   │   ├── classify-risk/    # Risk classification
│   │   │   ├── conformity-assessment/[ai_system_id]/  # NEW
│   │   │   ├── compliance-timeline/[ai_system_id]/    # NEW
│   │   │   ├── scan-repo/        # GitHub scanning
│   │   │   └── ...
│   │   ├── dashboard/
│   │   │   ├── layout.tsx        # Sidebar + nav (251 lines)
│   │   │   ├── scanner/          # Step 1
│   │   │   ├── analyzer/[id]/    # Step 2
│   │   │   ├── risk-classifier/[id]/  # Step 3 + GPAI panel
│   │   │   ├── context-verifier/[id]/ # Step 4
│   │   │   ├── report/[id]/      # Step 5
│   │   │   ├── registry/         # AI System Registry
│   │   │   ├── conformity/[id]/  # NEW — Conformity tracker
│   │   │   └── timeline/         # NEW — Timeline dashboard
│   │   └── admin/                # Admin panel
│   ├── components/               # Reusable UI components
│   └── lib/                      # Core business logic modules
├── __tests__/                    # Jest tests (33 tests)
└── AGENT_CONTEXT.md              # This file
```
