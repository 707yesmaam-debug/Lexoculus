'use client';

import { useState, useEffect, useCallback } from 'react';
import { Network, Terminal, Copy, Check, Key, Plus, Trash2, Shield, AlertTriangle } from 'lucide-react';

interface ApiKeyInfo {
    id: string;
    key_prefix: string;
    name: string;
    created_at: string;
    last_used_at: string | null;
    revoked_at: string | null;
}

export default function ConfigureMCPPage() {
    const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    const fetchKeys = useCallback(async () => {
        try {
            const res = await fetch('/api/mcp/keys');
            if (res.ok) {
                const data = await res.json();
                setKeys(data.keys || []);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchKeys(); }, [fetchKeys]);

    const activeKeys = keys.filter((k) => !k.revoked_at);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/mcp/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `Key ${activeKeys.length + 1}` }),
            });
            if (res.ok) {
                const data = await res.json();
                setNewKey(data.key);
                fetchKeys();
            }
        } catch {
            // silent
        } finally {
            setGenerating(false);
        }
    };

    const handleRevoke = async (keyId: string) => {
        if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return;
        try {
            await fetch('/api/mcp/keys', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyId }),
            });
            fetchKeys();
        } catch {
            // silent
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleTestConnection = async () => {
        if (activeKeys.length === 0) return;
        setTestResult('testing');
        try {
            // We test via our own invoke endpoint with a simple resource call
            const res = await fetch('/api/mcp/invoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resource: 'lexoculus://purpose-categories' }),
            });
            // Note: This will fail with 401 since we're not passing a key from the browser,
            // but it proves the endpoint is live. A 401 means the endpoint is working.
            setTestResult(res.status === 401 || res.ok ? 'success' : 'error');
        } catch {
            setTestResult('error');
        }
    };

    // Build the config snippet with the user's first active key prefix
    const keyPlaceholder = newKey || (activeKeys.length > 0 ? `${activeKeys[0].key_prefix}...` : 'lx_YOUR_API_KEY');

    const cursorConfig = `{
  "mcpServers": {
    "lexoculus": {
      "command": "npx",
      "args": ["-y", "@lex-oculus/mcp-client@latest"],
      "env": {
        "LEXOCULUS_API_URL": "https://www.lexoculus.com",
        "LEXOCULUS_API_KEY": "${keyPlaceholder}"
      }
    }
  }
}`;

    const claudeConfig = `{
  "mcpServers": {
    "lexoculus": {
      "command": "npx",
      "args": ["-y", "@lex-oculus/mcp-client@latest"],
      "env": {
        "LEXOCULUS_API_URL": "https://www.lexoculus.com",
        "LEXOCULUS_API_KEY": "${keyPlaceholder}"
      }
    }
  }
}`;

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <header className="px-6 py-8 border-b-2 border-black bg-[#F5F5F5]">
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">08_ENGINE_CONFIG</h1>
                <p className="font-mono text-sm text-zinc-600">Connect AI Coding Assistants to the LexOculus Universal Compliance Engine</p>
            </header>

            <main className="flex-1 p-6 max-w-6xl w-full mx-auto pb-24">
                {/* Status Banner */}
                <div className="mb-8 p-6 border-2 border-black flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-zinc-50">
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2 mb-2">
                            <Network className="w-5 h-5 text-[#FF4F00]" />
                            Universal Engine Cloud Relay
                        </h2>
                        <p className="text-sm font-mono text-zinc-600">
                            Your AI IDE connects to LexOculus via a secure API relay. Generate an engine key below.
                        </p>
                    </div>
                    <button
                        onClick={handleTestConnection}
                        disabled={testResult === 'testing'}
                        className="px-4 py-2 border border-black font-mono text-xs hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                    >
                        {testResult === 'testing' ? '[TESTING...]' : testResult === 'success' ? '[ENDPOINT_LIVE ✓]' : testResult === 'error' ? '[ENDPOINT_DOWN ✗]' : '[TEST_CONNECTION]'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: API Keys */}
                    <div className="space-y-6">
                        {/* API Key Section */}
                        <section>
                            <h3 className="font-mono text-sm uppercase tracking-widest text-[#FF4F00] mb-4 flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                01_Universal_Engine_Keys
                            </h3>

                            {/* New key banner */}
                            {newKey && (
                                <div className="mb-4 p-4 border-2 border-green-600 bg-green-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className="w-4 h-4 text-green-700" />
                                        <span className="font-mono text-xs font-bold text-green-800">KEY GENERATED — COPY NOW</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <code className="font-mono text-xs bg-white border border-green-300 p-2 flex-1 truncate text-green-800">
                                            {newKey}
                                        </code>
                                        <button
                                            onClick={() => handleCopy(newKey, 'newkey')}
                                            className="p-2 border border-green-600 hover:bg-green-600 hover:text-white transition-colors"
                                        >
                                            {copied === 'newkey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1 mt-2">
                                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                                        <p className="text-[10px] font-mono text-amber-700">This key will not be shown again. Save it now.</p>
                                    </div>
                                </div>
                            )}

                            {/* Key list */}
                            <div className="border border-zinc-200 divide-y divide-zinc-200">
                                {loading ? (
                                    <div className="p-4 font-mono text-xs text-zinc-400 animate-pulse">[LOADING_KEYS...]</div>
                                ) : activeKeys.length === 0 ? (
                                    <div className="p-4 font-mono text-xs text-zinc-500">No API keys yet. Generate one to get started.</div>
                                ) : (
                                    activeKeys.map((k) => (
                                        <div key={k.id} className="p-3 flex items-center justify-between font-mono text-xs">
                                            <div>
                                                <span className="font-bold text-black">{k.key_prefix}...</span>
                                                <span className="text-zinc-400 ml-2">{k.name}</span>
                                                {k.last_used_at && (
                                                    <span className="text-zinc-400 ml-2">
                                                        Last used: {new Date(k.last_used_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRevoke(k.id)}
                                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                title="Revoke key"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={generating || activeKeys.length >= 5}
                                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-black font-mono text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                                {generating ? 'Generating...' : 'Generate API Key'}
                            </button>
                            {activeKeys.length >= 5 && (
                                <p className="text-[10px] font-mono text-amber-600 mt-1">Maximum 5 active keys. Revoke an existing key first.</p>
                            )}
                        </section>

                        {/* What tools are available */}
                        <section>
                            <h3 className="font-mono text-sm uppercase tracking-widest text-[#FF4F00] mb-4 flex items-center gap-2">
                                <Terminal className="w-4 h-4" />
                                Available Tools
                            </h3>
                            <div className="border border-zinc-200 p-4 space-y-3 font-mono text-xs bg-zinc-50">
                                {[
                                    ['check_dependency', 'Scan packages for EU AI Act obligations'],
                                    ['classify_risk', 'Calculate risk tiers for AI integrations'],
                                    ['match_constraints', 'Match against Annex III constraints'],
                                    ['validate_classification', 'Verify risk classifications'],
                                    ['get_conformity_pathway', 'Get conformity assessment pathway'],
                                    ['classify_gpai', 'Detect GPAI providers and obligations'],
                                ].map(([name, desc]) => (
                                    <div key={name} className="flex justify-between items-start gap-2">
                                        <span className="font-bold text-black shrink-0">{name}</span>
                                        <span className="text-zinc-500 text-right">{desc}</span>
                                    </div>
                                ))}
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
                                <h4 className="font-bold text-lg mb-3">Cursor IDE</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-700 font-mono mb-4">
                                    <li>Open Settings <kbd className="px-1.5 py-0.5 border border-zinc-300 rounded bg-zinc-100 text-xs">Ctrl+Shift+J</kbd></li>
                                    <li>Go to <b>Features → MCP Servers</b></li>
                                    <li>Click <b>+ Add New MCP Server</b></li>
                                    <li>Paste the config below</li>
                                </ol>
                                <div className="relative bg-black text-white p-4 text-xs overflow-x-auto border-2 border-black">
                                    <pre className="font-mono text-green-400">{cursorConfig}</pre>
                                    <button
                                        onClick={() => handleCopy(cursorConfig, 'cursor')}
                                        className="absolute right-2 top-2 p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        {copied === 'cursor' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Claude Desktop */}
                            <div className="border border-zinc-300 p-6 bg-white">
                                <h4 className="font-bold text-lg mb-3">Claude Desktop</h4>
                                <p className="text-sm font-mono text-zinc-700 mb-3">Add to your <code className="bg-zinc-100 px-1">claude_desktop_config.json</code>:</p>
                                <div className="relative bg-black text-white p-4 text-xs overflow-x-auto border border-zinc-700">
                                    <pre className="font-mono text-green-400">{claudeConfig}</pre>
                                    <button
                                        onClick={() => handleCopy(claudeConfig, 'claude')}
                                        className="absolute right-2 top-2 p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        {copied === 'claude' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Windsurf */}
                            <div className="border border-zinc-300 p-6 bg-white">
                                <h4 className="font-bold text-lg mb-3">Windsurf</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-700 font-mono">
                                    <li>Open Command Palette</li>
                                    <li>Type <b>MCP: Add Server</b></li>
                                    <li>Select <b>Command (stdio)</b></li>
                                    <li>Command: <code className="text-green-600">npx</code></li>
                                    <li>Args: <code className="text-green-600">-y @lex-oculus/mcp-client@latest</code></li>
                                    <li>Set env: <code className="text-green-600">LEXOCULUS_API_KEY=lx_...</code> and <code className="text-green-600">LEXOCULUS_API_URL=https://www.lexoculus.com</code></li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
