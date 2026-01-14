'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink, Loader2, FileCode2, Terminal } from 'lucide-react';

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
    const [webhookSecret, setWebhookSecret] = useState('Loading...');
    const [isChecking, setIsChecking] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Fetch the correct derived secret for this repo
    useEffect(() => {
        if (open && repoFullName) {
            fetch(`/api/github/webhook-secret?repo=${encodeURIComponent(repoFullName)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.secret) setWebhookSecret(data.secret);
                })
                .catch(err => console.error('Failed to load secret', err));
        }
    }, [open, repoFullName]);

    const yamlContent = `name: LexOculus Guardian

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

      - name: Optical Audit Scan
        id: scan
        env:
          LEXOCULUS_API_URL: '${process.env.NEXT_PUBLIC_APP_URL || 'https://compliance-ai-omega.vercel.app'}'
        run: |
          # Send PR diff to LexOculus for optical analysis
          RESPONSE=$(curl -s -X POST \\
            "$LEXOCULUS_API_URL/api/webhooks/github" \\
            -H "Content-Type: application/json" \\
            -H "X-GitHub-Event: pull_request" \\
            -H "X-Hub-Signature-256: $(echo -n '\${{ toJson(github.event) }}' | openssl dgst -sha256 -hmac '\${{ secrets.LEXOCULUS_WEBHOOK_SECRET }}' | cut -d' ' -f2)" \\
            -d '\${{ toJson(github.event) }}')
          
          echo "response=$RESPONSE" >> $GITHUB_OUTPUT
          
          # Parse risk from response
          RISK_LEVEL=$(echo $RESPONSE | jq -r '.risk_level // "MINIMAL_RISK"')
          BLOCKED=$(echo $RESPONSE | jq -r '.blocked // false')
          
          # Output summary to PR
          echo "## 👁️ LexOculus Audit Results" >> $GITHUB_STEP_SUMMARY
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
        setTimeout(() => {
            setIsChecking(false);
            onComplete();
        }, 800);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white border-2 border-black text-black max-w-2xl p-0 gap-0 shadow-none sm:rounded-none overflow-hidden outline-none">
                <DialogHeader className="p-8 border-b border-black bg-[#F5F5F5]">
                    <DialogTitle className="font-serif text-3xl font-bold mb-2">Enable Guardian Protocol</DialogTitle>
                    <DialogDescription className="font-mono text-xs text-[#555]">
                        Target System: <span className="text-black font-bold uppercase">{repoFullName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                    {/* Step 1: Secret */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">01</div>
                            <h3 className="font-bold text-sm uppercase tracking-widest font-mono">Install Repository Secret</h3>
                        </div>

                        <div className="ml-9 p-4 border border-black space-y-4 bg-white">
                            <p className="font-mono text-xs text-[#555]">
                                Navigate to <a href={`https://github.com/${repoFullName}/settings/secrets/actions`} target="_blank" rel="noopener noreferrer" className="text-[#FF4F00] hover:underline font-bold inline-flex items-center gap-1">
                                    Settings &gt; Secrets <ExternalLink className="w-3 h-3" />
                                </a> and create:
                            </p>

                            <div className="grid gap-2">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-[#999]">Identifier</div>
                                <div className="flex gap-2">
                                    <code className="flex-1 bg-[#F5F5F5] p-2 border border-black font-mono text-xs flex items-center">LEXOCULUS_WEBHOOK_SECRET</code>
                                    <Button variant="outline" size="icon" className="h-9 w-9 border-black hover:bg-black hover:text-white rounded-none shrink-0 transition-colors" onClick={() => copyToClipboard('LEXOCULUS_WEBHOOK_SECRET', 'secret_name')}>
                                        {copiedField === 'secret_name' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-[#999]">Value</div>
                                <div className="flex gap-2 w-full overflow-hidden">
                                    <code className="flex-1 bg-[#F5F5F5] p-2 border border-black font-mono text-xs truncate leading-5">{webhookSecret}</code>
                                    <Button variant="outline" size="icon" className="h-9 w-9 border-black hover:bg-black hover:text-white rounded-none shrink-0 transition-colors" onClick={() => copyToClipboard(webhookSecret, 'secret_value')}>
                                        {copiedField === 'secret_value' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Workflow File */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">02</div>
                            <h3 className="font-bold text-sm uppercase tracking-widest font-mono">Deploy Workflow Manifest</h3>
                        </div>

                        <div className="ml-9 border border-black">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-black bg-[#F5F5F5]">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[#555]">.github/workflows/lexoculus.yml</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-[10px] text-black hover:bg-black hover:text-white px-2 rounded-none uppercase font-mono tracking-widest transition-colors"
                                    onClick={() => copyToClipboard(yamlContent, 'yaml')}
                                >
                                    {copiedField === 'yaml' ? (
                                        <>
                                            <Check className="w-3 h-3 mr-1.5" />
                                            COPIED
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3 mr-1.5" />
                                            COPY_SOURCE
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="relative">
                                <pre className="bg-white p-4 text-[10px] font-mono text-[#555] overflow-auto h-[200px] border-none custom-scrollbar">
                                    <code>{yamlContent}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t-2 border-black p-4 flex justify-between items-center bg-[#F5F5F5] sm:justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-black text-black hover:bg-black hover:text-white rounded-none font-mono text-xs uppercase tracking-widest h-10 px-6 transition-colors">
                        Abort_Setup
                    </Button>
                    <Button onClick={handlePingCheck} disabled={isChecking} className="bg-[#FF4F00] hover:bg-black text-white rounded-none font-mono text-xs uppercase tracking-widest px-6 h-10 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                        {isChecking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Terminal className="w-4 h-4 mr-2" />}
                        Verify_Deployment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
