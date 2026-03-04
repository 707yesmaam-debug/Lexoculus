/**
 * classify_gpai — MCP Tool
 *
 * Classifies whether an AI system uses General-Purpose AI models
 * under EU AI Act Chapter V (Articles 51-55).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { classifyGPAI } from '../../../src/lib/compliance/eu-ai-act/gpai-classifier.js';

export function registerGpaiTool(server: McpServer): void {
    server.registerTool(
        'classify_gpai',
        {
            title: 'Classify GPAI',
            description:
                'Classify whether an AI system uses General-Purpose AI (GPAI) models ' +
                'under EU AI Act Chapter V. Detects providers (OpenAI, Anthropic, Meta, etc.), ' +
                'systemic risk status, and maps applicable obligations.',
            inputSchema: z.object({
                libraries: z
                    .array(z.string())
                    .describe('Detected library names (e.g. ["openai", "langchain", "anthropic"])'),
                capabilities: z
                    .array(z.string())
                    .optional()
                    .default([])
                    .describe('AI capabilities (e.g. ["text_generation", "code_generation"])'),
                frameworks: z
                    .array(z.string())
                    .optional()
                    .default([])
                    .describe('AI frameworks (e.g. ["LangChain", "LlamaIndex"])'),
                model_types: z
                    .array(z.string())
                    .optional()
                    .default([])
                    .describe('Model types detected (e.g. ["gpt-4", "claude-3-opus"])'),
            }),
            annotations: {
                readOnlyHint: true,
            },
        },
        async (args) => {
            // Construct minimal LlmCapabilityAnalysis-compatible object
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
                detected_model_types: args.model_types,
                has_ml_pipeline: false,
                has_training_code: false,
                has_inference_code: true,
                has_data_processing: false,
                has_model_serialization: false,
                estimated_risk_indicators: {},
                llm_model_used: 'mcp-direct',
                analysis_duration_ms: 0,
                confidence_score: 1.0,
                analysis_notes: 'GPAI classification via MCP tool',
                manual_review_needed: false,
                analyzed_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = classifyGPAI(analysis as any);

            const output = {
                is_gpai_deployer: result.is_gpai_deployer,
                is_gpai_provider: result.is_gpai_provider,
                is_systemic_risk: result.is_systemic_risk,
                open_source_exception: result.open_source_exception,
                detected_providers: result.detected_providers.map((p) => ({
                    provider_name: p.provider_name,
                    matched_by: p.matched_by,
                    confidence: p.confidence,
                    systemic_risk: p.systemic_risk,
                    open_source: p.open_source,
                })),
                detected_models: result.detected_models,
                obligations: result.obligations.map((o) => ({
                    article: o.article,
                    title: o.title,
                    description: o.description,
                    applies_to: o.applies_to,
                    deadline: o.deadline,
                    systemic_risk_only: o.systemic_risk_only,
                })),
                transparency_requirements: result.transparency_requirements,
                article_references: result.article_references,
                summary: result.summary,
            };

            return {
                content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
            };
        },
    );
}
