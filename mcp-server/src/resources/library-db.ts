/**
 * lexoculus://library-database — MCP Resource
 *
 * Exposes the AI library risk database (200+ libraries with risk categories).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ALL_LIBRARIES, LIBRARY_STATS } from '../../../src/lib/analysis/ai-library-database.js';

export function registerLibraryDbResource(server: McpServer): void {
    server.registerResource(
        'library-database',
        'lexoculus://library-database',
        {
            title: 'AI Library Risk Database',
            description:
                `Database of ${LIBRARY_STATS.total} known AI/ML libraries with risk indicators, ` +
                'categories, and high-risk flags. Covers Python, JavaScript, Rust, and Go ecosystems.',
            mimeType: 'application/json',
        },
        async (uri) => ({
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify(
                        {
                            stats: LIBRARY_STATS,
                            libraries: ALL_LIBRARIES.map((lib) => ({
                                name: lib.name,
                                aliases: lib.aliases,
                                category: lib.category,
                                risk_indicators: lib.risk_indicators,
                                ecosystem: lib.ecosystem,
                                high_risk: lib.high_risk_flag || false,
                                confidence: lib.confidence,
                                use_cases: lib.use_cases,
                            })),
                        },
                        null,
                        2,
                    ),
                },
            ],
        }),
    );
}
