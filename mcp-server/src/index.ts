/**
 * LexOculus MCP Server
 *
 * Standalone stdio server that exposes LexOculus's EU AI Act compliance engine
 * to AI coding assistants (Cursor, Copilot, Claude Desktop, Windsurf).
 *
 * Transport: stdio (JSON-RPC over stdin/stdout)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerCheckDependencyTool } from './tools/check-dependency.js';
import { registerClassifyRiskTool } from './tools/classify-risk.js';
import { registerConstraintTools } from './tools/constraints.js';
import { registerConformityTool } from './tools/conformity.js';
import { registerGpaiTool } from './tools/gpai.js';

import { registerConstraintsResource } from './resources/constraints.js';
import { registerLibraryDbResource } from './resources/library-db.js';
import { registerPurposeMapResource } from './resources/purpose-map.js';

const server = new McpServer({
    name: 'lexoculus',
    version: '1.0.0',
});

// Register tools (6 total)
registerCheckDependencyTool(server);
registerClassifyRiskTool(server);
registerConstraintTools(server);      // match_constraints + validate_classification
registerConformityTool(server);
registerGpaiTool(server);

// Register resources (3 total)
registerConstraintsResource(server);
registerLibraryDbResource(server);
registerPurposeMapResource(server);

async function main() {
    // Start stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error('Fatal error starting MCP server:', error);
    process.exit(1);
});
