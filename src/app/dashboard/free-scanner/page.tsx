'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function FreeScannerPage() {
    const router = useRouter();
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usage, setUsage] = useState<{ remaining: number, limit: number } | null>(null);

    // Fetch usage on mount
    useEffect(() => {
        fetch('/api/subscription/usage')
            .then(res => res.json())
            .then(data => {
                if (data.usage && data.limits) {
                    setUsage({
                        remaining: data.remaining.scans,
                        limit: data.limits.scans_limit
                    });
                }
            })
            .catch(console.error);
    }, []);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/public-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo_url: url })
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.upgrade) {
                    // Show upgrade message
                    setError(`LIMIT_REACHED: ${data.message}`);
                } else {
                    setError(data.message || 'Scan failed');
                }
                setIsLoading(false);
                return;
            }

            // Success! Redirect to the analyzer
            // The free tier gets the FULL tech experience
            router.push(`/dashboard/analyzer/${data.repo_scan_id}`);

        } catch (err) {
            setError('Connection error. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-12">
            <div className="mb-12 md:mb-16 border-b border-black pb-8">
                <div className="font-mono text-[10px] md:text-xs text-[#FF4F00] mb-4 tracking-widest uppercase flex flex-col md:flex-row md:justify-between gap-2">
                    <span>PHASE_01 // PUBLIC_INGESTION</span>
                    {usage && (
                        <span>USAGE: {usage.limit - usage.remaining}/{usage.limit} SCANS</span>
                    )}
                </div>
                <h1 className="font-serif text-3xl md:text-5xl font-bold mb-4 tracking-tight">Public Audit.</h1>
                <p className="font-mono text-xs md:text-sm text-[#555] max-w-xl leading-relaxed">
                    Enter any public repository to initiate compliance analysis.
                    Full regulatory deep-dive included.
                </p>
            </div>

            <div className="max-w-2xl">
                <form onSubmit={handleScan} className="space-y-6">
                    <div className="space-y-2">
                        <label className="font-mono text-xs uppercase block text-[#555]">
                            Repository URL (Public Only)
                        </label>
                        <div className="flex flex-col md:flex-row gap-4">
                            <input
                                type="url"
                                placeholder="https://github.com/owner/repo"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full md:flex-1 border border-black p-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#FF4F00] placeholder:text-[#999]"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !url}
                                className="w-full md:w-auto bg-black text-white px-8 py-4 md:py-0 font-mono text-sm hover:bg-[#FF4F00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'INITIATE_SCAN'}
                            </button>
                        </div>
                    </div>
                </form>

                {error && (
                    <div className="mt-8 border border-[#FF4F00] bg-[#FFF5F0] p-4 flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-[#FF4F00] shrink-0" />
                        <div className="space-y-2">
                            <p className="font-mono text-xs text-[#FF4F00] font-bold">
                                {error.includes('LIMIT') ? 'USAGE_LIMIT_EXCEEDED' : 'INGESTION_ERROR'}
                            </p>
                            <p className="text-sm">{error.split(':').pop()}</p>

                            {error.includes('LIMIT') && (
                                <Link href="/pricing" className="inline-flex items-center gap-2 text-xs font-bold underline decoration-[#FF4F00] hover:text-[#FF4F00] mt-2">
                                    UPGRADE_TO_PRO <ArrowRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-12 md:mt-16 pt-8 border-t border-[#E5E5E5] grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-serif font-bold text-lg mb-2">Capabilities</h4>
                        <ul className="space-y-1 font-mono text-xs text-[#555]">
                            <li>[✓] Deep Dependency Parsing</li>
                            <li>[✓] AI Model Detection</li>
                            <li>[✓] Annex III Classification</li>
                            <li>[✓] Context Verification</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-serif font-bold text-lg mb-2">Limitations</h4>
                        <ul className="space-y-1 font-mono text-xs text-[#555]">
                            <li>[!] Public Repositories Only</li>
                            <li>[!] 2 Scans / Month</li>
                            <li>[!] No PDF Reports</li>
                            <li>[!] No GitHub Action</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
