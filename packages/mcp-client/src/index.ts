#!/usr/bin/env node

/**
 * @lexoculus/mcp-client
 *
 * Lightweight MCP stdio server that proxies tool/resource calls
 * to the LexOculus cloud API at https://lexoculus.com/api/mcp/invoke.
 *
 * Usage in IDE config:
 *   "command": "npx",
 *   "args": ["-y", "@lexoculus/mcp-client"],
 *   "env": { "LEXOCULUS_API_KEY": "lx_..." }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_BASE = process.env.LEXOCULUS_API_URL || 'https://lexoculus.com';
const API_KEY = process.env.LEXOCULUS_API_KEY;

if (!API_KEY) {
    console.error(
        '[LexOculus MCP] Error: LEXOCULUS_API_KEY environment variable is required.\n' +
        'Get your key at: https://lexoculus.com/dashboard/configure-mcp',
    );
    process.exit(1);
}

// ─── HTTP Helper ─────────────────────────────────────────────────────

async function invokeCloud(payload: { tool?: string; args?: Record<string, unknown>; resource?: string }) {
    const res = await fetch(`${API_BASE}/api/mcp/invoke`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(`LexOculus API error (${res.status}): ${(errBody as { error?: string }).error || 'Unknown error'}`);
    }

    return res.json();
}

function makeTextResult(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function makeErrorResult(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }], isError: true };
}

// ─── Server Setup ────────────────────────────────────────────────────

const server = new McpServer({
    name: 'lexoculus',
    version: '1.0.0',
});

// ─── Tool Registrations (proxy to cloud) ─────────────────────────────

server.registerTool(
    'check_dependency',
    {
        title: 'Check Dependency',
        description:
            'Check if packages/libraries trigger EU AI Act compliance obligations.',
        inputSchema: z.object({
            packages: z.array(z.string()).optional().describe('Package names to check'),
            manifest_content: z.string().optional().describe('Raw manifest content'),
            manifest_type: z
                .enum(['package.json', 'requirements.txt', 'pyproject.toml', 'setup.py', 'pipfile', 'environment.yml', 'go.mod', 'cargo.toml'])
                .optional()
                .describe('Manifest type'),
        }),
        annotations: { readOnlyHint: true },
    },
    async (args) => {
        try {
            const data = await invokeCloud({ tool: 'check_dependency', args });
            return makeTextResult(data.result);
        } catch (e) { return makeErrorResult(e); }
    },
);

server.registerTool(
    'classify_risk',
    {
        title: 'Classify Risk',
        description: "Classify an AI system's risk tier under the EU AI Act.",
        inputSchema: z.object({
            libraries: z.array(z.string()).describe('Detected AI/ML library names'),
            patterns: z.array(z.string()).optional().default([]).describe('Detected code patterns'),
            intended_purpose: z.string().optional().describe('Intended purpose category'),
            capabilities: z.array(z.string()).optional().default([]).describe('AI capabilities'),
            frameworks: z.array(z.string()).optional().default([]).describe('AI frameworks'),
        }),
        annotations: { readOnlyHint: true },
    },
    async (args) => {
        try {
            const data = await invokeCloud({ tool: 'classify_risk', args });
            return makeTextResult(data.result);
        } catch (e) { return makeErrorResult(e); }
    },
);

server.registerTool(
    'match_constraints',
    {
        title: 'Match Constraints',
        description: 'Match libraries and patterns against EU AI Act regulatory constraints.',
        inputSchema: z.object({
            libraries: z.array(z.string()).describe('Detected library names'),
            patterns: z.array(z.string()).optional().default([]).describe('Detected code patterns'),
            deployment_context: z.string().optional().describe('Deployment context'),
            intended_purpose: z.string().optional().describe('Intended purpose category'),
        }),
        annotations: { readOnlyHint: true },
    },
    async (args) => {
        try {
            const data = await invokeCloud({ tool: 'match_constraints', args });
            return makeTextResult(data.result);
        } catch (e) { return makeErrorResult(e); }
    },
);

server.registerTool(
    'validate_classification',
    {
        title: 'Validate Classification',
        description: 'Validate an AI risk classification against the EU AI Act constraint engine.',
        inputSchema: z.object({
            risk_level: z.enum(['UNACCEPTABLE', 'HIGH_RISK', 'LIMITED_RISK', 'MINIMAL_RISK']).describe('Risk classification'),
            risk_score: z.number().min(0).max(100).optional().default(50).describe('Numeric risk score'),
            libraries: z.array(z.string()).describe('Detected library names'),
            patterns: z.array(z.string()).optional().default([]).describe('Code patterns'),
            deployment_context: z.string().optional().describe('Deployment context'),
            intended_purpose: z.string().optional().describe('Intended purpose'),
        }),
        annotations: { readOnlyHint: true },
    },
    async (args) => {
        try {
            const data = await invokeCloud({ tool: 'validate_classification', args });
            return makeTextResult(data.result);
        } catch (e) { return makeErrorResult(e); }
    },
);

server.registerTool(
    'get_conformity_pathway',
    {
        title: 'Get Conformity Pathway',
        description: 'Determine the EU AI Act conformity assessment pathway.',
        inputSchema: z.object({
            risk_classification: z.string().describe('Risk classification (e.g. HIGH_RISK)'),
            matched_articles: z
                .array(z.object({ article: z.string(), category: z.string() }))
                .optional()
                .default([])
                .describe('Matched Annex III articles'),
            is_gpai_deployer: z.boolean().optional().default(false).describe('GPAI deployer flag'),
        }),
        annotations: { readOnlyHint: true },
    },
    async (args) => {
        try {
            const data = await invokeCloud({ tool: 'get_conformity_pathway', args });
            return makeTextResult(data.result);
        } catch (e) { return makeErrorResult(e); }
    },
);

server.registerTool(
    'classify_gpai',
    {
        title: 'Classify GPAI',
        description: 'Detect General-Purpose AI model usage and map obligations.',
        inputSchema: z.object({
            libraries: z.array(z.string()).describe('Detected library names'),
            capabilities: z.array(z.string()).optional().default([]).describe('AI capabilities'),
            model_types: z.array(z.string()).optional().default([]).describe('Model types'),
        }),
        annotations: { readOnlyHint: true },
    },
    async (args) => {
        try {
            const data = await invokeCloud({ tool: 'classify_gpai', args });
            return makeTextResult(data.result);
        } catch (e) { return makeErrorResult(e); }
    },
);

// ─── Resource Registrations ──────────────────────────────────────────

server.resource(
    'constraints',
    'lexoculus://constraints/all',
    { description: 'All EU AI Act regulatory constraints' },
    async () => {
        const data = await invokeCloud({ resource: 'lexoculus://constraints/all' });
        return { contents: [{ uri: 'lexoculus://constraints/all', text: JSON.stringify(data.data, null, 2), mimeType: 'application/json' }] };
    },
);

server.resource(
    'library-database',
    'lexoculus://library-database',
    { description: 'AI library risk database (200+ libraries)' },
    async () => {
        const data = await invokeCloud({ resource: 'lexoculus://library-database' });
        return { contents: [{ uri: 'lexoculus://library-database', text: JSON.stringify(data.data, null, 2), mimeType: 'application/json' }] };
    },
);

server.resource(
    'purpose-categories',
    'lexoculus://purpose-categories',
    { description: 'Purpose category mappings for risk classification' },
    async () => {
        const data = await invokeCloud({ resource: 'lexoculus://purpose-categories' });
        return { contents: [{ uri: 'lexoculus://purpose-categories', text: JSON.stringify(data.data, null, 2), mimeType: 'application/json' }] };
    },
);

// ─── Start ───────────────────────────────────────────────────────────

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error('Fatal error starting LexOculus MCP client:', error);
    process.exit(1);
});
