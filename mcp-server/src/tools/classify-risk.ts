/**
 * classify_risk — MCP Tool
 *
 * Classifies AI system risk under EU AI Act using the full classification engine
 * (constraint validation + GPAI detection).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { classifyRiskFull } from '../../../src/lib/compliance/eu-ai-act/risk-classifier.js';

export function registerClassifyRiskTool(server: McpServer): void {
    server.registerTool(
        'classify_risk',
        {
            title: 'Classify Risk',
            description:
                'Classify an AI system\'s risk tier under the EU AI Act. ' +
                'Provide detected libraries, code patterns, and optionally the intended purpose. ' +
                'Returns risk classification, score, matched Annex III articles, GPAI status, and key findings.',
            inputSchema: z.object({
                libraries: z
                    .array(z.string())
                    .describe('Detected AI/ML library names (e.g. ["deepface", "openai", "langchain"])'),
                patterns: z
                    .array(z.string())
                    .optional()
                    .default([])
                    .describe('Detected code patterns (e.g. ["face_recognition", "emotion_detection"])'),
                intended_purpose: z
                    .string()
                    .optional()
                    .describe(
                        'Intended purpose category. One of: developer_tool, chatbot, data_analytics, ' +
                        'content_generation, critical_infrastructure, financial_services, healthcare, ' +
                        'hr_recruitment, law_enforcement, education, biometrics, migration_border, ' +
                        'justice_legal, autonomous_vehicles, general',
                    ),
                capabilities: z
                    .array(z.string())
                    .optional()
                    .default([])
                    .describe('AI capabilities detected (e.g. ["text_generation", "image_classification"])'),
                frameworks: z
                    .array(z.string())
                    .optional()
                    .default([])
                    .describe('AI frameworks detected (e.g. ["PyTorch", "TensorFlow"])'),
            }),
            annotations: {
                readOnlyHint: true,
            },
        },
        async (args) => {
            // Construct a minimal LlmCapabilityAnalysis-compatible object
            const analysis = {
                id: 'mcp-session',
                repo_scan_id: 'mcp-session',
                user_id: 'mcp-user',
                is_ai_system: true,
                capabilities: args.capabilities,
                libraries: args.libraries.map((name: string) => ({
                    name,
                    matched_string: name,
                    source: 'mcp_input',
                })),
                ai_frameworks: args.frameworks,
                programming_languages: [],
                detected_model_types: [],
                has_ml_pipeline: false,
                has_training_code: false,
                has_inference_code: true,
                has_data_processing: false,
                has_model_serialization: false,
                estimated_risk_indicators: {
                    detected_patterns: args.patterns,
                },
                llm_model_used: 'mcp-direct',
                analysis_duration_ms: 0,
                confidence_score: 1.0,
                analysis_notes: 'Classification via MCP tool',
                manual_review_needed: false,
                analyzed_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = classifyRiskFull(analysis as any, args.intended_purpose);

            const output = {
                risk_classification: result.risk_classification,
                risk_score: result.risk_score,
                matched_annex_iii_articles: result.matched_annex_iii_articles.map((a) => ({
                    article: a.article,
                    category: a.category,
                    description: a.description,
                    risk_tier: a.riskTier,
                    applicable: a.applicable,
                    reasoning: a.reasoning,
                })),
                key_findings: result.key_findings,
                risk_narrative: result.risk_narrative,
                gpai_classification: result.gpai_classification
                    ? {
                        is_gpai_deployer: result.gpai_classification.is_gpai_deployer,
                        is_gpai_provider: result.gpai_classification.is_gpai_provider,
                        is_systemic_risk: result.gpai_classification.is_systemic_risk,
                        detected_providers: result.gpai_classification.detected_providers,
                        obligations: result.gpai_classification.obligations.map((o) => ({
                            article: o.article,
                            title: o.title,
                            description: o.description,
                            applies_to: o.applies_to,
                        })),
                        summary: result.gpai_classification.summary,
                    }
                    : null,
                constraint_validation: result.constraint_validation
                    ? {
                        was_overridden: result.constraint_validation.was_overridden,
                        override_reason: result.constraint_validation.override_reason,
                        legal_citations: result.constraint_validation.legal_citations,
                        purpose_filter: result.constraint_validation.purpose_filter,
                    }
                    : null,
                prohibition_reasons: result.prohibition_reasons,
                also_has_high_risk_elements: result.preliminary_assessment?.also_has_high_risk_elements ?? false,
            };

            return {
                content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
            };
        },
    );
}
