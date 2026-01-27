'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';

interface UpgradePromptProps {
    variant?: 'sidebar' | 'banner' | 'card';
    className?: string;
}

export default function UpgradePrompt({ variant = 'banner', className = '' }: UpgradePromptProps) {
    const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSubscription() {
            try {
                const res = await fetch('/api/subscription/status');
                if (res.ok) {
                    const data = await res.json();
                    setSubscriptionTier(data.tier || 'free');
                }
            } catch (error) {
                console.error('Failed to fetch subscription:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchSubscription();
    }, []);

    // Don't show upgrade prompts for pro users
    if (!loading && subscriptionTier !== 'free') {
        return null;
    }

    const statusText = loading ? 'LOADING...' : `STATUS: ${subscriptionTier.toUpperCase()}`;
    const tierStatusText = loading ? 'LOADING...' : `TIER_STATUS: ${subscriptionTier.toUpperCase()}`;

    if (variant === 'sidebar') {
        return (
            <div className={`border border-[#E5E5E5] p-4 bg-white ${className}`}>
                <div className="font-mono text-[10px] text-[#999] mb-2 uppercase tracking-widest flex justify-between">
                    <span>{statusText}</span>
                    <Lock className="w-3 h-3" />
                </div>
                <p className="font-serif text-sm font-bold mb-3 leading-tight">
                    Analyze private repos & generate reports.
                </p>
                <Link href="/pricing" className="block w-full text-center bg-black text-white py-2 font-mono text-[10px] hover:bg-[#FF4F00] transition-colors">
                    PRO_COMING_SOON
                </Link>
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className={`border border-black p-8 text-center bg-[#F5F5F5] ${className}`}>
                <div className="inline-flex items-center justify-center w-12 h-12 border border-black rounded-full mb-6 bg-white">
                    <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-2xl font-bold mb-3">Professional Feature.</h3>
                <p className="font-mono text-sm text-[#555] mb-6 max-w-sm mx-auto">
                    This capability requires a Pro subscription.
                    Unlock unlimited private scans, PDF reports, and team collaboration.
                </p>
                <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 bg-[#FF4F00] text-white px-6 py-3 font-mono text-xs hover:bg-black transition-colors"
                >
                    JOIN_WAITLIST <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        );
    }

    // Default Banner
    return (
        <div className={`border border-black p-6 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${className}`}>
            <div>
                <div className="font-mono text-xs text-[#FF4F00] mb-1 tracking-widest">{tierStatusText}</div>
                <p className="font-serif font-bold text-lg">Unlock unlimited scans and compliance reports.</p>
            </div>
            <Link
                href="/pricing"
                className="whitespace-nowrap flex items-center gap-2 border-b border-black font-mono text-xs pb-1 hover:text-[#FF4F00] hover:border-[#FF4F00] transition-colors"
            >
                VIEW_PLANS <ArrowRight className="w-3 h-3" />
            </Link>
        </div>
    );
}
