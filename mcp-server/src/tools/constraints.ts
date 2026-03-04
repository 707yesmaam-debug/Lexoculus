/**
 * match_constraints + validate_classification — MCP Tools
 *
 * Exposes the Constraint Engine for direct constraint matching and
 * LLM classification validation.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getConstraintEngine } from '../../../src/lib/compliance/eu-ai-act/constraint-engine.js';

export function registerConstraintTools(server: McpServer): void {
    // Tool 1: match_constraints
    server.registerTool(
        'match_constraints',
        {
            title: 'Match Constraints',
            description:
                'Match detected libraries and code patterns against EU AI Act regulatory constraints. ' +
                'Returns constraint matches, risk score, and contextual questions for ambiguous cases.',
            inputSchema: z.object({
                libraries: z
                    .array(z.string())
                    .describe('Detected library names (e.g. ["deepface", "openai"])'),
                patterns: z
                    .array(z.string())
                    .optional()
                    .default([])
                    .describe('Detected code patterns (e.g. ["face_recognition", "social_score"])'),
                deployment_context: z
                    .string()
                    .optional()
                    .describe('Deployment context description (e.g. "healthcare", "law enforcement")'),
                intended_purpose: z
                    .string()
                    .optional()
                    .describe('Intended purpose category'),
            }),
            annotations: {
                readOnlyHint: true,
            },
        },
        async (args) => {
            const engine = getConstraintEngine();
            const result = engine.matchConstraints(
                args.libraries,
                args.patterns,
                args.deployment_context,
                args.intended_purpose,
            );

            const output = {
                highest_risk: result.highest_risk,
                risk_score: result.risk_score,
                requires_manual_review: result.requires_manual_review,
                matches: result.matches.map((m) => ({
                    constraint_id: m.constraint.constraint_id,
                    regulation_source: m.constraint.regulation_source,
                    category: m.constraint.category,
                    description: m.constraint.description,
                    risk_level: m.constraint.risk_level,
                    matched_indicators: m.matched_indicators,
                    confidence: m.confidence,
                    requires_context: m.requires_context,
                    official_text: m.constraint.official_text,
                    requirements: m.constraint.requirements,
                })),
                contextual_questions: result.contextual_questions,
            };

            return {
                content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
            };
        },
    );

    // Tool 2: validate_classification
    server.registerTool(
        'validate_classification',
        {
            title: 'Validate Classification',
            description:
                'Validate an AI risk classification against the EU AI Act constraint engine. ' +
                'The constraint engine is the source of truth and may override the classification. ' +
                'Returns validated risk level, override status, and audit trail.',
            inputSchema: z.object({
                risk_level: z
                    .enum([
                        'UNACCEPTABLE',
                        'HIGH_RISK',
                        'LIMITED_RISK',
                        'MINIMAL_RISK',
                    ])
                    .describe('The risk classification to validate'),
                risk_score: z
                    .number()
                    .min(0)
                    .max(100)
                    .optional()
                    .default(50)
                    .describe('Numeric risk score (0-100)'),
                libraries: z
                    .array(z.string())
                    .describe('Detected library names'),
                patterns: z
                    .array(z.string())
                    .optional()
                    .default([])
                    .describe('Detected code patterns'),
                deployment_context: z
                    .string()
                    .optional()
                    .describe('Deployment context'),
                intended_purpose: z
                    .string()
                    .optional()
                    .describe('Intended purpose category'),
            }),
            annotations: {
                readOnlyHint: true,
            },
        },
        async (args) => {
            const engine = getConstraintEngine();
            const result = engine.validateLLMClassification(
                args.risk_level,
                args.risk_score,
                args.libraries,
                args.patterns,
                args.deployment_context,
                args.intended_purpose,
            );

            const output = {
                original_risk: result.original_risk,
                validated_risk: result.validated_risk,
                was_overridden: result.was_overridden,
                override_reason: result.override_reason,
                matched_constraints: result.matched_constraints,
                audit_trail: result.audit_trail,
            };

            return {
                content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
            };
        },
    );
}
