import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/mcp/api-keys';

// Import compliance engine functions (same as local MCP server uses)
import { scanDependencies, getScanSummary } from '@/lib/analysis/dependency-scanner';
import { findLibraryByName } from '@/lib/analysis/ai-library-database';
import { classifyRiskFull } from '@/lib/compliance/eu-ai-act/risk-classifier';
import { getConstraintEngine } from '@/lib/compliance/eu-ai-act/constraint-engine';
import { determineConformityPathway } from '@/lib/compliance/eu-ai-act/conformity-assessment';
import { classifyGPAI } from '@/lib/compliance/eu-ai-act/gpai-classifier';
import { ALL_CONSTRAINTS, type RiskTier } from '@/lib/compliance/eu-ai-act/annex-iii-articles';
import { ALL_LIBRARIES } from '@/lib/analysis/ai-library-database';
import { PURPOSE_CATEGORY_MAP, PURPOSE_OPTIONS } from '@/lib/compliance/eu-ai-act/purpose-categories';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mcp/invoke
 *
 * Cloud MCP relay endpoint. Authenticates via API key and dispatches
 * tool/resource calls to the compliance engine.
 *
 * Headers: Authorization: Bearer lx_...
 * Body: { tool: string, args: object } OR { resource: string }
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid Authorization header. Use: Bearer lx_...' },
                { status: 401 },
            );
        }

        const apiKey = authHeader.slice(7);
        const userId = await validateApiKey(apiKey);
        if (!userId) {
            return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 });
        }

        // 2. Parse request
        const body = await request.json();
        const { tool, args, resource } = body as {
            tool?: string;
            args?: Record<string, unknown>;
            resource?: string;
        };

        // 3. Dispatch
        if (resource) {
            return handleResource(resource);
        }

        if (tool && args) {
            return handleTool(tool, args);
        }

        return NextResponse.json(
            { error: 'Request must include either { tool, args } or { resource }' },
            { status: 400 },
        );
    } catch (error) {
        console.error('[MCP Invoke] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ─── Resource Handlers ───────────────────────────────────────────────

function handleResource(uri: string) {
    switch (uri) {
        case 'lexoculus://constraints/all':
            return NextResponse.json({ data: ALL_CONSTRAINTS });

        case 'lexoculus://library-database':
            return NextResponse.json({ data: ALL_LIBRARIES });

        case 'lexoculus://purpose-categories':
            return NextResponse.json({
                data: { categories: PURPOSE_CATEGORY_MAP, options: PURPOSE_OPTIONS },
            });

        default:
            return NextResponse.json({ error: `Unknown resource: ${uri}` }, { status: 404 });
    }
}

// ─── Tool Handlers ───────────────────────────────────────────────────

function handleTool(tool: string, args: Record<string, unknown>) {
    switch (tool) {
        case 'check_dependency':
            return handleCheckDependency(args);
        case 'classify_risk':
            return handleClassifyRisk(args);
        case 'match_constraints':
            return handleMatchConstraints(args);
        case 'validate_classification':
            return handleValidateClassification(args);
        case 'get_conformity_pathway':
            return handleConformityPathway(args);
        case 'classify_gpai':
            return handleClassifyGpai(args);
        default:
            return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 404 });
    }
}

// ── check_dependency ─────────────────────────────────────────────────

function handleCheckDependency(args: Record<string, unknown>) {
    const packages = args.packages as string[] | undefined;
    const manifestContent = args.manifest_content as string | undefined;
    const manifestType = args.manifest_type as string | undefined;

    // Fast path: just package names
    if (packages?.length && !manifestContent) {
        const results = packages.map((pkg) => {
            const lib = findLibraryByName(pkg);
            if (!lib) return { package: pkg, found: false, is_ai_library: false };
            return {
                package: pkg,
                found: true,
                is_ai_library: true,
                name: lib.name,
                category: lib.category,
                risk_indicators: lib.risk_indicators,
                high_risk: lib.high_risk_flag || false,
                ecosystem: lib.ecosystem,
            };
        });
        return NextResponse.json({ result: { is_ai_system: results.some((r) => r.is_ai_library), packages: results } });
    }

    // Full scan path
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repoScan: any = {
        requirements_txt_content: null,
        package_json_content: null,
        pyproject_toml_content: null,
        file_tree: null,
        readme_content: null,
    };

    if (manifestContent && manifestType) {
        switch (manifestType) {
            case 'requirements.txt':
                repoScan.requirements_txt_content = manifestContent;
                break;
            case 'package.json':
                try { repoScan.package_json_content = JSON.parse(manifestContent); }
                catch { return NextResponse.json({ error: 'Invalid JSON in manifest_content' }, { status: 400 }); }
                break;
            case 'pyproject.toml':
                repoScan.pyproject_toml_content = { raw: manifestContent };
                break;
            default:
                repoScan[`${manifestType.replace(/[.-]/g, '_')}_content`] = manifestContent;
        }
    }

    if (packages?.length) {
        const existing = repoScan.requirements_txt_content || '';
        repoScan.requirements_txt_content = existing + '\n' + packages.join('\n');
    }

    const result = scanDependencies(repoScan);
    return NextResponse.json({
        result: {
            is_ai_system: result.is_ai_system,
            confidence_score: result.confidence_score,
            detected_libraries: result.detected_libraries.map((l) => ({
                name: l.library.name,
                category: l.library.category,
                risk_indicators: l.library.risk_indicators,
                high_risk: l.library.high_risk_flag || false,
            })),
            risk_indicators: result.risk_indicators,
            high_risk_libraries: result.high_risk_libraries,
            summary: getScanSummary(result),
        },
    });
}

// ── classify_risk ────────────────────────────────────────────────────

function handleClassifyRisk(args: Record<string, unknown>) {
    const libraries = args.libraries as string[];
    const patterns = (args.patterns as string[]) || [];
    const intendedPurpose = args.intended_purpose as string | undefined;
    const capabilities = (args.capabilities as string[]) || [];
    const frameworks = (args.frameworks as string[]) || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const analysis: any = {
        id: 'mcp-cloud',
        repo_scan_id: 'mcp-cloud',
        user_id: 'mcp-cloud',
        is_ai_system: true,
        capabilities,
        libraries: libraries.map((name) => ({ name, matched_string: name, source: 'mcp_input' })),
        ai_frameworks: frameworks,
        programming_languages: [],
        detected_model_types: [],
        has_ml_pipeline: false,
        has_training_code: false,
        has_inference_code: true,
        has_data_processing: false,
        has_model_serialization: false,
        estimated_risk_indicators: { detected_patterns: patterns },
        llm_model_used: 'mcp-cloud',
        analysis_duration_ms: 0,
        confidence_score: 1.0,
        analysis_notes: 'Classification via MCP cloud relay',
        manual_review_needed: false,
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    const result = classifyRiskFull(analysis, intendedPurpose);
    return NextResponse.json({
        result: {
            risk_classification: result.risk_classification,
            risk_score: result.risk_score,
            matched_annex_iii_articles: result.matched_annex_iii_articles.map((a) => ({
                article: a.article,
                category: a.category,
                description: a.description,
                risk_tier: a.riskTier,
                applicable: a.applicable,
            })),
            key_findings: result.key_findings,
            gpai_classification: result.gpai_classification
                ? {
                    is_gpai_deployer: result.gpai_classification.is_gpai_deployer,
                    detected_providers: result.gpai_classification.detected_providers,
                    obligations: result.gpai_classification.obligations.map((o) => ({
                        article: o.article,
                        title: o.title,
                    })),
                }
                : null,
        },
    });
}

// ── match_constraints ────────────────────────────────────────────────

function handleMatchConstraints(args: Record<string, unknown>) {
    const engine = getConstraintEngine();
    const result = engine.matchConstraints(
        args.libraries as string[],
        (args.patterns as string[]) || [],
        args.deployment_context as string | undefined,
        args.intended_purpose as string | undefined,
    );

    return NextResponse.json({
        result: {
            highest_risk: result.highest_risk,
            risk_score: result.risk_score,
            requires_manual_review: result.requires_manual_review,
            matches: result.matches.map((m) => ({
                constraint_id: m.constraint.constraint_id,
                category: m.constraint.category,
                risk_level: m.constraint.risk_level,
                matched_indicators: m.matched_indicators,
                confidence: m.confidence,
            })),
        },
    });
}

// ── validate_classification ──────────────────────────────────────────

function handleValidateClassification(args: Record<string, unknown>) {
    const engine = getConstraintEngine();
    const result = engine.validateLLMClassification(
        args.risk_level as RiskTier,
        (args.risk_score as number) || 50,
        args.libraries as string[],
        (args.patterns as string[]) || [],
        args.deployment_context as string | undefined,
        args.intended_purpose as string | undefined,
    );

    return NextResponse.json({
        result: {
            original_risk: result.original_risk,
            validated_risk: result.validated_risk,
            was_overridden: result.was_overridden,
            override_reason: result.override_reason,
        },
    });
}

// ── get_conformity_pathway ───────────────────────────────────────────

function handleConformityPathway(args: Record<string, unknown>) {
    const result = determineConformityPathway(
        args.risk_classification as string,
        (args.matched_articles as Array<{ article: string; category: string }>) || [],
        (args.is_gpai_deployer as boolean) || false,
    );

    return NextResponse.json({ result });
}

// ── classify_gpai ────────────────────────────────────────────────────

function handleClassifyGpai(args: Record<string, unknown>) {
    const libraries = args.libraries as string[];
    const capabilities = (args.capabilities as string[]) || [];
    const modelTypes = (args.model_types as string[]) || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const analysis: any = {
        id: 'mcp-cloud',
        repo_scan_id: 'mcp-cloud',
        user_id: 'mcp-cloud',
        is_ai_system: true,
        capabilities,
        libraries: libraries.map((name) => ({ name, matched_string: name, source: 'mcp_input' })),
        ai_frameworks: [],
        programming_languages: [],
        detected_model_types: modelTypes,
        has_ml_pipeline: false,
        has_training_code: false,
        has_inference_code: true,
        has_data_processing: false,
        has_model_serialization: false,
        estimated_risk_indicators: { detected_patterns: [] },
        llm_model_used: 'mcp-cloud',
        analysis_duration_ms: 0,
        confidence_score: 1.0,
        analysis_notes: 'GPAI classification via MCP cloud relay',
        manual_review_needed: false,
        analyzed_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    const result = classifyGPAI(analysis);
    return NextResponse.json({
        result: {
            is_gpai_deployer: result.is_gpai_deployer,
            is_gpai_provider: result.is_gpai_provider,
            is_systemic_risk: result.is_systemic_risk,
            detected_providers: result.detected_providers,
            obligations: result.obligations.map((o) => ({
                article: o.article,
                title: o.title,
                description: o.description,
                applies_to: o.applies_to,
            })),
            summary: result.summary,
        },
    });
}
