/**
 * get_conformity_pathway — MCP Tool
 *
 * Determines the conformity assessment pathway for an AI system based on
 * its risk classification and matched Annex III articles.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { determineConformityPathway } from '../../../src/lib/compliance/eu-ai-act/conformity-assessment.js';

export function registerConformityTool(server: McpServer): void {
    server.registerTool(
        'get_conformity_pathway',
        {
            title: 'Get Conformity Pathway',
            description:
                'Determine the EU AI Act conformity assessment pathway (Module A, B+C, etc.) ' +
                'for an AI system based on its risk classification and matched Annex III articles. ' +
                'Returns assessment steps, timeline, and notified body requirements.',
            inputSchema: z.object({
                risk_classification: z
                    .enum([
                        'UNACCEPTABLE',
                        'HIGH_RISK',
                        'LIMITED_RISK',
                        'MINIMAL_RISK',
                    ])
                    .describe('The risk classification of the AI system'),
                matched_articles: z
                    .array(
                        z.object({
                            article: z
                                .string()
                                .optional()
                                .describe('Article reference (e.g. "Annex III(1)(a)")'),
                            category: z
                                .string()
                                .optional()
                                .describe('Category name (e.g. "Remote Biometric Identification")'),
                            description: z.string().optional(),
                            riskTier: z.string().optional(),
                        }),
                    )
                    .optional()
                    .default([])
                    .describe('Matched Annex III articles from risk classification'),
                is_gpai_deployer: z
                    .boolean()
                    .optional()
                    .default(false)
                    .describe('Whether the system deploys GPAI models'),
            }),
            annotations: {
                readOnlyHint: true,
            },
        },
        async (args) => {
            const pathway = determineConformityPathway(
                args.risk_classification,
                args.matched_articles,
                args.is_gpai_deployer,
            );

            const output = {
                applicable_module: pathway.applicable_module,
                module_name: pathway.module_name,
                module_description: pathway.module_description,
                legal_basis: pathway.legal_basis,
                requires_notified_body: pathway.requires_notified_body,
                self_assessment_eligible: pathway.self_assessment_eligible,
                estimated_timeline: pathway.estimated_timeline,
                total_steps: pathway.total_steps,
                steps: pathway.steps.map((s) => ({
                    step_id: s.step_id,
                    order: s.order,
                    title: s.title,
                    description: s.description,
                    article_reference: s.article_reference,
                    requirements: s.requirements,
                    deliverables: s.deliverables,
                    estimated_duration: s.estimated_duration,
                    requires_notified_body: s.requires_notified_body,
                })),
                notes: pathway.notes,
            };

            return {
                content: [{ type: 'text' as const, text: JSON.stringify(output, null, 2) }],
            };
        },
    );
}
