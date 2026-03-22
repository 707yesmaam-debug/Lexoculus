# Memory: Tech the product into context

## Task
Ingested and analyzed the technical architecture, product workflows, and codebase structure of LexOculus (ComplianceAI) to provide comprehensive context for future development and assistance.

## Findings
- **Core Architecture**: 5-stage pipeline (Scanner -> LLM Analysis -> Risk Classify -> Context Verify -> Report).
- **Scanner**: Hybrid deterministic (200+ library DB) + Pattern matching (30+ regex) + Context signals (README/File names).
- **Compliance Engine**: Maps detected capabilities to EU AI Act Annex III articles with a 10-step classification pipeline.
- **Data Model**: 20 Prisma models centered around `User`, `RepoScan`, and various stages of `RiskAssessment`.
- **MCP Server**: Standalone server exposing tools like `check_dependency`, `classify_risk`, and `match_constraints` for AI assistants.
- **Tech Stack**: Next.js 16 (App Router), TypeScript, Prisma/Supabase, Groq (Llama 3.3), Dodo Payments (EUR).
- **Design System**: "Optical Legality" (Brutalist, Helvetica/Times/Courier, Safety Orange accent).

## Verification
- Verified directory structure matches `TECHNICAL_ARCHITECTURE.md`.
- Analyzed `prisma/schema.prisma` for relationship integrity.
- Inspected `mcp-server/src/index.ts` and `src/lib/analysis/dependency-scanner.ts` for implementation details.

## Contextual Readiness
I am now fully briefed on the system's "brain" and its regulatory mapping logic. Ready to assist with feature development, debugging, or compliance analysis.

## Date
2026-03-22
