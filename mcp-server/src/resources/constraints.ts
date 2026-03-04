/**
 * lexoculus://constraints/all — MCP Resource
 *
 * Exposes all EU AI Act constraints (Article 5, Annex III, Article 50).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ALL_CONSTRAINTS } from '../../../src/lib/compliance/eu-ai-act/annex-iii-articles.js';

export function registerConstraintsResource(server: McpServer): void {
    server.registerResource(
        'constraints',
        'lexoculus://constraints/all',
        {
            title: 'EU AI Act Constraints',
            description:
                'All EU AI Act constraints with articles, risk tiers, code indicators, ' +
                'contextual questions, and exceptions. Source: Regulation (EU) 2024/1689.',
            mimeType: 'application/json',
        },
        async (uri) => ({
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify(
                        ALL_CONSTRAINTS.map((c) => ({
                            constraint_id: c.constraint_id,
                            regulation_source: c.regulation_source,
                            risk_level: c.risk_level,
                            category: c.category,
                            description: c.description,
                            official_text: c.official_text,
                            code_indicators: c.code_indicators,
                            detection_method: c.detection_method,
                            contextual_questions: c.contextual_questions,
                            requirements: c.requirements,
                            examples: c.examples,
                        })),
                        null,
                        2,
                    ),
                },
            ],
        }),
    );
}
