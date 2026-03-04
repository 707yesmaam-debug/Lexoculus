'use client';

import { useState, useEffect } from 'react';
import { Network, Terminal, Copy, Check, Info } from 'lucide-react';

interface MCPStatus {
    status: 'installed' | 'not_installed' | 'loading' | 'error';
    command?: string;
    version?: string;
}

export default function ConfigureMCPPage() {
    const [mcpStatus, setMcpStatus] = useState<MCPStatus>({ status: 'loading' });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function checkStatus() {
            try {
                const res = await fetch('/api/mcp-status');
                if (res.ok) {
                    const data = await res.json();
                    setMcpStatus({
                        status: 'installed',
                        command: data.command,
                        version: data.version
                    });
                } else {
                    setMcpStatus({ status: 'not_installed' });
                }
            } catch {
                setMcpStatus({ status: 'error' });
            }
        }
        checkStatus();
    }, []);

    const handleCopy = () => {
        const cmd = mcpStatus.command || 'npm run mcp';
        navigator.clipboard.writeText(cmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <header className="px-6 py-8 border-b-2 border-black bg-[#F5F5F5]">
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">08_CONFIGURE_MCP</h1>
                <p className="font-mono text-sm text-zinc-600">Connect Agentic Coding Assistants to the LexOculus Compliance Engine</p>
            </header>

            <main className="flex-1 p-6 max-w-6xl w-full mx-auto pb-24">
                {/* Status Banner */}
                <div className="mb-10 p-6 border-2 border-black flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-zinc-50">
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2 mb-2">
                            <Network className="w-5 h-5 text-[#FF4F00]" />
                            MCP Server Status
                        </h2>
                        <p className="text-sm font-mono text-zinc-600">
                            The Model Context Protocol (MCP) server allows AI IDEs (Cursor, Windsurf) to securely access your local compliance engine.
                        </p>
                    </div>

                    <div className="flex shrink-0">
                        {mcpStatus.status === 'loading' && (
                            <div className="px-4 py-2 bg-gray-200 border border-gray-400 font-mono text-xs animate-pulse">
                                [DETECTING...]
                            </div>
                        )}
                        {mcpStatus.status === 'installed' && (
                            <div className="flex items-center gap-4">
                                <div className="px-4 py-2 bg-green-100 border border-green-600 text-green-800 font-mono text-xs flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    [READY_FOR_CONNECTION]
                                </div>
                                <span className="font-mono text-xs text-zinc-500">v{mcpStatus.version}</span>
                            </div>
                        )}
                        {(mcpStatus.status === 'not_installed' || mcpStatus.status === 'error') && (
                            <div className="px-4 py-2 bg-red-100 border border-red-600 text-red-800 font-mono text-xs">
                                [OFFLINE / NOT DETECTED]
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Command */}
                    <div className="space-y-8">
                        <section>
                            <h3 className="font-mono text-sm uppercase tracking-widest text-[#FF4F00] mb-4 flex items-center gap-2">
                                <Terminal className="w-4 h-4" />
                                01_Activation_Command
                            </h3>
                            <p className="text-sm text-zinc-700 mb-4">
                                Use the following command in your AI assistant's MCP configuration. This launches a "headless" LexOculus node that communicates purely via stdout/stdin.
                            </p>

                            <div className="relative border-2 border-black bg-black text-white p-4 group">
                                <code className="font-mono text-sm text-green-400">
                                    npm run mcp
                                </code>
                                <button
                                    onClick={handleCopy}
                                    className="absolute right-2 top-2 p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-zinc-700"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </section>

                        <section>
                            <h3 className="font-mono text-sm uppercase tracking-widest text-[#FF4F00] mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                What can the AI do?
                            </h3>
                            <div className="border border-zinc-200 p-6 space-y-4 font-mono text-xs bg-zinc-50">
                                <div className="pb-4 border-b border-zinc-200">
                                    <div className="font-bold text-black mb-1">TOOL: check_dependency</div>
                                    <div className="text-zinc-600">Scans your `package.json` for EU AI Act obligations.</div>
                                </div>
                                <div className="pb-4 border-b border-zinc-200">
                                    <div className="font-bold text-black mb-1">TOOL: classify_risk</div>
                                    <div className="text-zinc-600">Calculates precise risk tiers for AI integrations.</div>
                                </div>
                                <div className="pb-4 border-b border-zinc-200">
                                    <div className="font-bold text-black mb-1">TOOL: match_constraints</div>
                                    <div className="text-zinc-600">Validates logic against Annex III / Article 5 direct constraints.</div>
                                </div>
                                <div className="pt-2">
                                    <div className="font-bold text-black mb-1">RESOURCE: lexoculus://constraints</div>
                                    <div className="text-zinc-600">Gives AI direct access to regulatory text corpus.</div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: IDE Instructions */}
                    <div>
                        <h3 className="font-mono text-sm uppercase tracking-widest text-[#FF4F00] mb-4">
                            02_IDE_Configuration
                        </h3>

                        <div className="space-y-6">
                            {/* Cursor */}
                            <div className="border border-black p-6 hover:shadow-[4px_4px_0px_#000] transition-shadow bg-white">
                                <h4 className="font-bold text-lg mb-2">Cursor IDE</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-700 font-mono">
                                    <li>Open Cursor Settings <kbd className="px-1.5 py-0.5 border border-zinc-300 rounded bg-zinc-100 text-xs">Cmd/Ctrl + Shift + J</kbd></li>
                                    <li>Navigate to <b>Features → MCP Servers</b></li>
                                    <li>Click <b>+ Add New MCP Server</b></li>
                                    <li>Set Name: <span className="bg-zinc-100 px-1 border border-zinc-300">LexOculus</span></li>
                                    <li>Set Type: <span className="text-[#FF4F00]">command</span></li>
                                    <li>Paste Command: <span className="bg-zinc-100 px-1 border border-zinc-300 text-green-600 font-bold">npm run mcp</span></li>
                                    <li>Save and verify Connection</li>
                                    <li className="text-black font-semibold mt-4 list-none italic">
                                        Try asking: "What handles EU AI Act compliance if I install deepface?"
                                    </li>
                                </ol>
                            </div>

                            {/* Windsurf */}
                            <div className="border border-zinc-300 p-6 opacity-70 hover:opacity-100 transition-opacity bg-white">
                                <h4 className="font-bold text-lg mb-2">Codeium Windsurf</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-700 font-mono">
                                    <li>Open Windsurf Command Palette</li>
                                    <li>Type: <b>MCP: Add Server</b></li>
                                    <li>Select <b>Command execution (stdio)</b></li>
                                    <li>Command: <span className="text-green-600 font-bold">npx</span></li>
                                    <li>Args: <span className="text-green-600 font-bold">tsx mcp-server/src/index.ts</span></li>
                                </ol>
                            </div>

                            {/* Claude Desktop */}
                            <div className="border border-zinc-300 p-6 opacity-70 hover:opacity-100 transition-opacity bg-white">
                                <h4 className="font-bold text-lg mb-2">Claude Desktop</h4>
                                <p className="text-sm font-mono text-zinc-700 mb-3">Add to your `claude_desktop_config.json`:</p>
                                <pre className="bg-zinc-100 p-3 border border-zinc-200 text-xs overflow-x-auto text-zinc-800 font-mono">
                                    {`"mcpServers": {
  "lexoculus": {
    "command": "npm",
    "args": ["run", "mcp"]
  }
}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
