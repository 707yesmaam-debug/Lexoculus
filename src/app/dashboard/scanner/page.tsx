'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GitHubConnectButton from '@/components/GitHubConnectButton';
import RepoSelector from '@/components/RepoSelector';
import ScanStatus from '@/components/ScanStatus';
import { Loader2 } from 'lucide-react';

function ScannerPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedUsername, setConnectedUsername] = useState<string | null>(null);
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'complete' | 'error'>('idle');
    const [scanError, setScanError] = useState<string | undefined>();
    const [scanData, setScanData] = useState<any>(null);

    useEffect(() => {
        // SECURITY: Reset all state on mount to prevent stale data from previous sessions
        // This is critical for session isolation
        setIsConnected(false);
        setConnectedUsername(null);
        setStep(1);
        setScanStatus('idle');
        setScanError(undefined);
        setScanData(null);

        const checkConnection = async () => {
            try {
                // Priority: Check URL params first
                if (searchParams.get('connected') === 'true') {
                    setIsConnected(true);
                    setStep(2);
                    router.replace('/dashboard/scanner');
                    return;
                }

                if (searchParams.get('error')) {
                    setScanError(getErrorMessage(searchParams.get('error')!));
                    setScanStatus('error');
                    return;
                }

                // Fallback: Check server status with cache-busting
                const res = await fetch('/api/github/status', {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    // DEBUG: Log the user ID to help verify session isolation
                    console.log('[Scanner] GitHub status check - User ID:', data.userId, 'Connected:', data.isConnected);

                    if (data.isConnected) {
                        setIsConnected(true);
                        setConnectedUsername(data.username || null);
                        setStep(2);
                    }
                }
            } catch (error) {
                console.error('Connection check failed:', error);
            }
        };

        checkConnection();
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
        <div className="max-w-4xl mx-auto p-12">
            <div className="mb-16 border-b border-black pb-8">
                <div className="font-mono text-xs text-[#FF4F00] mb-4 tracking-widest uppercase">
                    PHASE_01 // INGESTION
                </div>
                <h1 className="font-serif text-5xl font-bold mb-4 tracking-tight">Repository Scan.</h1>
                <p className="font-mono text-sm text-[#555] max-w-xl leading-relaxed">
                    Connect your version control system.
                    The engine will clone, parse, and map your codebase against regulatory frameworks.
                </p>
            </div>

            <div className="space-y-16">
                {/* Step 1: Connect */}
                <div className={`transition-opacity duration-500 ${step === 1 ? 'opacity-100' : (isConnected ? 'opacity-60' : 'opacity-30 pointer-events-none grayscale')}`}>
                    <div className="flex items-baseline justify-between border-b border-black mb-6 pb-2">
                        <h2 className="font-serif text-2xl font-bold">01. Connection Source</h2>
                        {isConnected && <span className="font-mono text-xs text-[#FF4F00]">[CONNECTED]</span>}
                    </div>

                    {!isConnected ? (
                        <div className="border border-black p-8 bg-[#F5F5F5]">
                            <p className="font-mono text-xs text-[#555] mb-8 max-w-md">
                                AUTHORIZATION REQUIRED.
                                GRANT READ-ONLY PERMISSIONS TO TARGET REPOSITORIES.
                            </p>
                            <GitHubConnectButton />
                        </div>
                    ) : (
                        <GitHubConnectButton initialConnected={true} />
                    )}
                </div>

                {/* Step 2: Select */}
                <div className={`transition-opacity duration-500 ${step === 2 ? 'opacity-100' : 'opacity-30 pointer-events-none grayscale'}`}>
                    <div className="flex items-baseline justify-between border-b border-black mb-6 pb-2">
                        <h2 className="font-serif text-2xl font-bold">02. Target System</h2>
                    </div>
                    <div className="border border-black bg-white">
                        <RepoSelector onSelect={handleRepoSelect} />
                    </div>
                </div>

                {/* Step 3: Status */}
                <div className={`transition-opacity duration-500 ${step === 3 ? 'opacity-100' : 'opacity-30 pointer-events-none grayscale'}`}>
                    <div className="flex items-baseline justify-between border-b border-black mb-6 pb-2">
                        <h2 className="font-serif text-2xl font-bold">03. Ingestion Status</h2>
                    </div>
                    <ScanStatus status={scanStatus} error={scanError} data={scanData} />
                </div>
            </div>
        </div>
    );
}

export default function ScannerPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-black animate-spin" />
            </div>
        }>
            <ScannerPageContent />
        </Suspense>
    );
}
