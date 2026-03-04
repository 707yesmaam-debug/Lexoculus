#!/usr/bin/env node

/**
 * LexOculus MCP Server — CLI Entry Point
 *
 * Usage:
 *   node mcp-server/bin/lexoculus-mcp.js
 *
 * Or configure in your IDE's MCP settings:
 *   { "command": "npx", "args": ["tsx", "mcp-server/src/index.ts"] }
 */

import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverEntry = resolve(__dirname, '..', 'src', 'index.ts');

try {
    execFileSync('npx', ['tsx', serverEntry], {
        stdio: 'inherit',
        cwd: resolve(__dirname, '..', '..'),
    });
} catch {
    process.exit(1);
}
