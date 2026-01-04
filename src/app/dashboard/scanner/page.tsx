'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GitHubConnectButton from '@/components/GitHubConnectButton';
import RepoSelector from '@/components/RepoSelector';
import ScanStatus from '@/components/ScanStatus';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

function ScannerPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [isConnected, setIsConnected] = useState(false);
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
    const [scanError, setScanError] = useState<string | undefined>();
    const [scanData, setScanData] = useState<any>(null);

    useEffect(() => {
        // Check connection status based on URL param from OAuth callback
        if (searchParams.get('connected') === 'true') {
            setIsConnected(true);
            setStep(2);
            // Clean URL
            router.replace('/dashboard/scanner');
        }
        // Handle errors
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setScanError(getErrorMessage(errorParam));
            setScanStatus('error');
        }
    }, [searchParams, router]);

    const handleRepoSelect = async (repoUrl: string) => {
        setScanStatus('scanning');
        setScanError(undefined);

        try {
            const response = await fetch('/api/repo/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo_url: repoUrl }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.needsReconnect) {
                    setIsConnected(false);
                    setStep(1);
                }
                throw new Error(data.message || 'Scan failed');
            }

            // Include repo_scan_id for Feature 2 navigation
            setScanData({
                ...data.metadata,
                repo_scan_id: data.repo_scan_id,
            });
            setScanStatus('complete');
            setStep(3);
        } catch (err) {
            setScanStatus('error');
            setScanError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const getErrorMessage = (code: string) => {
        switch (code) {
            case 'github_denied': return 'GitHub authorization was denied.';
            case 'oauth_failed': return 'Authentication failed. Please try again.';
            case 'not_authenticated': return 'Your session expired. Please log in again.';
            default: return 'An error occurred. Please try again.';
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-12">
                <h1 className="text-3xl font-bold text-zinc-100 tracking-tight mb-2">Repository Ingestion</h1>
                <p className="text-zinc-500">Connect a repository to begin the compliance analysis pipeline.</p>
            </div>

            {/* Steps Indicator - Sharp numerical design */}
            <div className="flex items-center gap-4 mb-12 border-b border-zinc-900 pb-6">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center font-mono text-xs font-bold border transition-colors ${step === s
                            ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                            : step > s
                                ? 'bg-zinc-900 text-zinc-500 border-zinc-800'
                                : 'bg-transparent text-zinc-700 border-zinc-800'
                            }`}>
                            {step > s ? '✓' : `0${s}`}
                        </div>
                        {s < 3 && <div className="w-8 h-[1px] bg-zinc-800" />}
                    </div>
                ))}
            </div>

            <div className="space-y-8">
                {/* Step 1: Connect */}
                <div className={`transition-opacity duration-500 ${step === 1 ? 'opacity-100' : (isConnected ? 'opacity-60' : 'opacity-40 pointer-events-none grayscale')}`}>
                    <h2 className="text-lg font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                        01. Connection Source
                        {step > 1 && <span className="text-xs text-blue-500 border border-blue-900/50 bg-blue-900/10 px-2 py-0.5 rounded-sm font-mono uppercase">Connected</span>}
                    </h2>
                    {!isConnected ? (
                        <div className="border border-zinc-800 p-6 bg-zinc-950/50">
                            <p className="text-sm text-zinc-400 mb-6 max-w-md">Authorize read-only access to your private GitHub repositories. We use a secure, encrypted token exchange.</p>
                            <GitHubConnectButton />
                        </div>
                    ) : (
                        <GitHubConnectButton initialConnected={true} />
                    )}
                </div>

                {/* Step 2: Select */}
                <div className={`transition-opacity duration-500 ${step === 2 ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                    <h2 className="text-lg font-semibold text-zinc-200 mb-4">02. Target Repository</h2>
                    <div className="border border-zinc-800 bg-zinc-950/50">
                        <RepoSelector onSelect={handleRepoSelect} />
                    </div>
                </div>

                {/* Step 3: Status */}
                <div className={`transition-opacity duration-500 ${step === 3 ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                    <h2 className="text-lg font-semibold text-zinc-200 mb-4">03. Ingestion Status</h2>
                    <ScanStatus status={scanStatus} error={scanError} data={scanData} />
                </div>
            </div>
        </div>
    );
}

export default function ScannerPage() {
    return (
        <Suspense fallback={
            <div className="max-w-2xl mx-auto py-16 flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mb-4" />
                <p className="text-zinc-500">Loading scanner...</p>
            </div>
        }>
            <ScannerPageContent />
        </Suspense>
    );
}
