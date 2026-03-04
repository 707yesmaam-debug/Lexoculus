import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Since we are running locally, we can check if the MCP server files exist
        // to determine if the "feature" is available/installed.
        const mcpServerPath = path.join(process.cwd(), 'mcp-server', 'package.json');

        try {
            await fs.access(mcpServerPath);
            // It's installed
            return NextResponse.json({
                status: 'installed',
                installed_at: mcpServerPath,
                command: 'npm run mcp',
                version: '1.0.0', // can read from package.json if needed
            });
        } catch {
            return NextResponse.json({
                status: 'not_installed',
                error: 'MCP server files not found in the project root'
            }, { status: 404 });
        }

    } catch (error) {
        console.error('Failed to check MCP status:', error);
        return NextResponse.json(
            { error: 'Failed to verify MCP server status' },
            { status: 500 }
        );
    }
}
