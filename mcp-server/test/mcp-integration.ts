import { spawn } from 'child_process';
import { resolve } from 'path';
import { createInterface } from 'readline';

async function runTest() {
    console.log('Starting MCP server integration test...');

    const serverProcess = spawn('npx', ['tsx', 'mcp-server/src/index.ts'], {
        cwd: resolve(process.cwd()),
        stdio: ['pipe', 'pipe', 'inherit'],
        shell: true,
    });

    const rl = createInterface({
        input: serverProcess.stdout,
        crlfDelay: Infinity,
    });

    // We'll ask the server for its tools
    const listToolsRequest = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
    };

    console.log('Sending tools/list request...');
    serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');

    const timeout = setTimeout(() => {
        console.error('Test timed out waiting for response.');
        serverProcess.kill();
        process.exit(1);
    }, 5000);

    for await (const line of rl) {
        try {
            const response = JSON.parse(line);
            if (response.id === 1 && response.result) {
                console.log('Received response:', JSON.stringify(response.result).substring(0, 100) + '...');
                const tools = response.result.tools || [];

                const expectedTools = [
                    'check_dependency',
                    'classify_risk',
                    'match_constraints',
                    'validate_classification',
                    'get_conformity_pathway',
                    'classify_gpai'
                ];

                let missing = 0;
                for (const expected of expectedTools) {
                    if (!tools.find((t: any) => t.name === expected)) {
                        console.error(`Missing expected tool: ${expected}`);
                        missing++;
                    } else {
                        console.log(`✅ Found tool: ${expected}`);
                    }
                }

                if (missing === 0) {
                    console.log('🎉 Integration test passed: All tools are correctly registered and server responds via stdio.');
                    clearTimeout(timeout);
                    serverProcess.kill();
                    process.exit(0);
                } else {
                    console.error(`Integration test failed: Missing ${missing} tools.`);
                    clearTimeout(timeout);
                    serverProcess.kill();
                    process.exit(1);
                }
            }
        } catch (e) {
            // Ignore non-JSON lines (e.g. startup logs if any, though MCP standard says only JSON-RPC on stdout)
        }
    }
}

runTest().catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
});
