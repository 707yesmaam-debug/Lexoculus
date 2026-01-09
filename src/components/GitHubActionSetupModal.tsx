'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';

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
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // The exact YAML content for the user
    // We use the current window location to determine the base URL if needed, 
    // but typically env vars are better. For now we assume the user is on the app.
    const yamlContent = `name: ComplianceAI Guardian

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  compliance-scan:
    name: EU AI Act Compliance Check
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Scan for EU AI Act compliance
        id: scan
        env:
          COMPLIANCEAI_API_URL: '${process.env.NEXT_PUBLIC_APP_URL || 'https://compliance-ai-omega.vercel.app'}'
        run: |
          # Send PR diff to ComplianceAI webhook for scanning
          RESPONSE=$(curl -s -X POST \\
            "$COMPLIANCEAI_API_URL/api/webhooks/github" \\
            -H "Content-Type: application/json" \\
            -H "X-GitHub-Event: pull_request" \\
            -H "X-Hub-Signature-256: $(echo -n '\${{ toJson(github.event) }}' | openssl dgst -sha256 -hmac '\${{ secrets.COMPLIANCEAI_WEBHOOK_SECRET }}' | cut -d' ' -f2)" \\
            -d '\${{ toJson(github.event) }}')
          
          echo "response=$RESPONSE" >> $GITHUB_OUTPUT
          
          # Parse risk from response (requires jq)
          RISK_LEVEL=$(echo $RESPONSE | jq -r '.risk_level // "MINIMAL_RISK"')
          BLOCKED=$(echo $RESPONSE | jq -r '.blocked // false')
          
          # Output summary to PR
          echo "## 🔍 ComplianceAI Scan Results" >> $GITHUB_STEP_SUMMARY
          echo "**Risk Level:** $RISK_LEVEL" >> $GITHUB_STEP_SUMMARY
          echo "**Blocked:** $BLOCKED" >> $GITHUB_STEP_SUMMARY

          if [ "$BLOCKED" = "true" ]; then
            echo "❌ PR blocked due to UNACCEPTABLE risk under EU AI Act"
            exit 1
          fi
`;

    const copyToClipboard = (text: string, fieldId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldId);
        setTimeout(() => setCopiedField(null), 2000);
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

                <div className="space-y-3 py-1">
                    {/* Step 1: Secret */}
                    <div className={`space-y-2 ${step !== 1 ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30">1</div>
                            <h3 className="font-medium text-zinc-200 text-sm">Add Repository Secret</h3>
                        </div>

                        <div className="ml-7 p-3 bg-zinc-900 rounded-md border border-zinc-800 space-y-2">
                            <p className="text-xs text-zinc-400">
                                Go to <a href={`https://github.com/${repoFullName}/settings/secrets/actions`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                                    Settings &gt; Secrets &gt; Actions <ExternalLink className="w-3 h-3" />
                                </a> and add a new repository secret:
                            </p>

                            <div className="grid gap-1">
                                <div className="text-[10px] font-mono text-zinc-500">Name</div>
                                <div className="flex gap-2">
                                    <code className="flex-1 bg-black p-1.5 rounded border border-zinc-800 text-xs font-mono text-purple-400">COMPLIANCEAI_WEBHOOK_SECRET</code>
                                    <Button variant="outline" size="icon" className="h-7 w-7 border-zinc-700 hover:bg-zinc-800 shrink-0" onClick={() => copyToClipboard('COMPLIANCEAI_WEBHOOK_SECRET', 'secret_name')}>
                                        {copiedField === 'secret_name' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-1">
                                <div className="text-[10px] font-mono text-zinc-500">Secret</div>
                                <div className="flex gap-2">
                                    <code className="flex-1 bg-black p-1.5 rounded border border-zinc-800 text-xs font-mono text-emerald-400">{webhookSecret}</code>
                                    <Button variant="outline" size="icon" className="h-7 w-7 border-zinc-700 hover:bg-zinc-800 shrink-0" onClick={() => copyToClipboard(webhookSecret, 'secret_value')}>
                                        {copiedField === 'secret_value' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Workflow File */}
                    <div className={`space-y-2 ${step !== 1 ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30">2</div>
                            <h3 className="font-medium text-zinc-200 text-sm">Add Workflow File</h3>
                        </div>

                        <div className="ml-7 bg-zinc-900 rounded-md border border-zinc-800 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
                                <span className="text-[10px] text-zinc-400 font-mono">.github/workflows/complianceai.yml</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 text-[10px] text-zinc-400 hover:text-white px-2 hover:bg-zinc-800"
                                    onClick={() => copyToClipboard(yamlContent, 'yaml')}
                                >
                                    {copiedField === 'yaml' ? (
                                        <>
                                            <Check className="w-3 h-3 mr-1.5 text-green-500" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3 mr-1.5" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>

                            <pre className="bg-black p-3 text-[10px] font-mono text-zinc-300 overflow-x-auto max-h-[120px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 block">
                                <code>{yamlContent}</code>
                            </pre>
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
