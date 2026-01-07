'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Copy, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';

interface GitHubActionSetupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    repoFullName: string;
    onComplete: () => void;
}

export default function GitHubActionSetupModal({
    open,
    onOpenChange,
    repoFullName,
    onComplete
}: GitHubActionSetupModalProps) {
    const [step, setStep] = useState(1);
    const [webhookSecret] = useState(() => 'gh_sec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    const [isChecking, setIsChecking] = useState(false);

    // The exact YAML content for the user
    // We use the current window location to determine the base URL if needed, 
    // but typically env vars are better. For now we assume the user is on the app.
    const yamlContent = `name: ComplianceAI Guardian

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  compliance-scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Run Compliance Scan
        uses: gemini-compliance-ai/action@v1
        with:
          webhook-url: '${process.env.NEXT_PUBLIC_APP_URL || 'https://compliance-ai.platform'}/api/webhooks/github'
          webhook-secret: \${{ secrets.COMPLIANCEAI_WEBHOOK_SECRET }}
          github-token: \${{ secrets.GITHUB_TOKEN }}
`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could show a toast here
    };

    const handlePingCheck = async () => {
        setIsChecking(true);
        // In a real scenario, we might want to trigger a test event from the server,
        // but since we want to check if the USER has set it up, we rely on them.
        // For this simplified flow, we'll just simulating a check or assume success if they say "Done".
        // To truly check, we'd need them to trigger an event.

        // However, for this UI, we will just trust the user has done it and complete the setup.
        setTimeout(() => {
            setIsChecking(false);
            onComplete();
        }, 800);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Enable Compliance Guardian</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Follow these steps to enable automated compliance scanning for <span className="font-mono text-white">{repoFullName}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Step 1: Secret */}
                    <div className={`space-y-3 ${step !== 1 ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">1</div>
                            <h3 className="font-medium text-zinc-200">Add Repository Secret</h3>
                        </div>

                        <div className="ml-9 p-4 bg-zinc-900 rounded-md border border-zinc-800 space-y-3">
                            <p className="text-sm text-zinc-400">
                                Go to <a href={`https://github.com/${repoFullName}/settings/secrets/actions`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                                    Settings &gt; Secrets and variables &gt; Actions <ExternalLink className="w-3 h-3" />
                                </a> and add a new repository secret:
                            </p>

                            <div className="grid gap-2">
                                <div className="text-xs font-mono text-zinc-500">Name</div>
                                <div className="flex gap-2">
                                    <code className="flex-1 bg-black p-2 rounded border border-zinc-800 text-sm font-mono text-purple-400">COMPLIANCEAI_WEBHOOK_SECRET</code>
                                    <Button variant="outline" size="icon" className="h-9 w-9 border-zinc-700 hover:bg-zinc-800" onClick={() => copyToClipboard('COMPLIANCEAI_WEBHOOK_SECRET')}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <div className="text-xs font-mono text-zinc-500">Secret</div>
                                <div className="flex gap-2">
                                    <code className="flex-1 bg-black p-2 rounded border border-zinc-800 text-sm font-mono text-emerald-400">{webhookSecret}</code>
                                    <Button variant="outline" size="icon" className="h-9 w-9 border-zinc-700 hover:bg-zinc-800" onClick={() => copyToClipboard(webhookSecret)}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Workflow File */}
                    <div className={`space-y-3 ${step !== 1 ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">2</div>
                            <h3 className="font-medium text-zinc-200">Add Workflow File</h3>
                        </div>

                        <div className="ml-9 p-4 bg-zinc-900 rounded-md border border-zinc-800 space-y-3">
                            <p className="text-sm text-zinc-400">
                                Create a new file in your repository at <span className="font-mono text-zinc-300">.github/workflows/complianceai.yml</span> with this content:
                            </p>

                            <div className="relative group">
                                <pre className="bg-black p-4 rounded border border-zinc-800 text-xs font-mono text-zinc-300 overflow-x-auto max-h-[200px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                                    {yamlContent}
                                </pre>
                                <Button
                                    className="absolute top-2 right-2 h-7 text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    size="sm"
                                    onClick={() => copyToClipboard(yamlContent)}
                                >
                                    <Copy className="w-3 h-3 mr-2" />
                                    Copy YAML
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-zinc-800 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                        Cancel
                    </Button>
                    <Button onClick={handlePingCheck} disabled={isChecking} className="bg-blue-600 hover:bg-blue-500 text-white">
                        {isChecking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        I've Added the File
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
