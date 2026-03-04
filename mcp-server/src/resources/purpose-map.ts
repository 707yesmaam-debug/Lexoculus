/**
 * lexoculus://purpose-categories — MCP Resource
 *
 * Exposes the purpose category map for intended use classification.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    PURPOSE_CATEGORY_MAP,
    PURPOSE_OPTIONS,
} from '../../../src/lib/compliance/eu-ai-act/purpose-categories.js';

export function registerPurposeMapResource(server: McpServer): void {
    server.registerResource(
        'purpose-categories',
        'lexoculus://purpose-categories',
        {
            title: 'EU AI Act Purpose Categories',
            description:
                'Maps intended purposes to eligible high-risk Annex III categories. ' +
                'Used to filter risk classification based on declared purpose.',
            mimeType: 'application/json',
        },
        async (uri) => ({
            contents: [
                {
                    uri: uri.href,
                    text: JSON.stringify(
                        {
                            purpose_category_map: PURPOSE_CATEGORY_MAP,
                            purpose_options: PURPOSE_OPTIONS,
                        },
                        null,
                        2,
                    ),
                },
            ],
        }),
    );
}
