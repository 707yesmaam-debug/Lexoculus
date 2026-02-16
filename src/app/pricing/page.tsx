'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, X, ArrowRight, Globe } from 'lucide-react';
import { REGIONAL_PRICING, Region, PricingTier, DEFAULT_REGION } from '@/lib/pricing-config';
import OpticalLogo from '@/components/OpticalLogo';

// Helper to get cookie by name
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [region, setRegion] = useState<Region>(DEFAULT_REGION);
    const [pricing, setPricing] = useState<PricingTier>(REGIONAL_PRICING[DEFAULT_REGION]);

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Hydrate region from cookie or default
        const regionCookie = getCookie('pricing_region') as Region;
        if (regionCookie && REGIONAL_PRICING[regionCookie]) {
            setRegion(regionCookie);
            setPricing(REGIONAL_PRICING[regionCookie]);
        }

        // Check session
        import('@/lib/supabase').then(({ createClient }) => {
            const supabase = createClient();
            supabase.auth.getSession().then(({ data: { session } }) => {
                setIsLoggedIn(!!session);
            });
        });
    }, []);

    const handleRegionChange = (newRegion: Region) => {
        setRegion(newRegion);
        setPricing(REGIONAL_PRICING[newRegion]);
        document.cookie = `pricing_region=${newRegion}; path=/; max-age=604800`; // 1 week
    };

    const price = billingCycle === 'monthly' ? pricing.monthly : Math.round(pricing.yearly / 12);
    const annualSavings = (pricing.monthly * 12) - pricing.yearly;

    return (
        <div className="min-h-screen bg-[#F5F5F5] font-sans text-black">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F5F5]/80 backdrop-blur-md border-b border-black">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <OpticalLogo />
                    </Link>
                    <div className="flex items-center gap-2 md:gap-6">
                        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#555]">
                            <Globe className="w-3 h-3" />
                            <select
                                value={region}
                                onChange={(e) => handleRegionChange(e.target.value as Region)}
                                className="bg-transparent border-none focus:ring-0 cursor-pointer uppercase"
                            >
                                {Object.keys(REGIONAL_PRICING).map(r => (
                                    <option key={r} value={r}>{r} Region</option>
                                ))}
                            </select>
                        </div>

                        {isLoggedIn ? (
                            <Link href="/dashboard" className="text-sm font-medium bg-black text-white px-4 py-2 hover:bg-[#FF4F00] transition-colors flex items-center gap-2">
                                Dashboard <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <>
                                <Link href="/auth/login" className="text-sm font-medium hover:text-[#FF4F00] transition-colors ml-2 md:ml-0">
                                    Login
                                </Link>
                                <Link href="/auth/signup" className="text-sm font-medium bg-black text-white px-4 py-2 hover:bg-[#FF4F00] transition-colors">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                        Predictable pricing for <br /> <span className="text-[#FF4F00]">compliance at scale.</span>
                    </h1>
                    Start your compliance journey. Upgrade for unlimited analysis and context verification.

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center justify-center p-1 border border-black bg-white">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 text-sm font-mono transition-colors ${billingCycle === 'monthly' ? 'bg-black text-white' : 'text-[#999] hover:text-black'}`}
                        >
                            MONTHLY
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-2 text-sm font-mono transition-colors flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-black text-white' : 'text-[#999] hover:text-black'}`}
                        >
                            YEARLY
                            <span className="text-[10px] text-[#FF4F00] font-bold tracking-wider">
                                (SAVE {pricing.symbol}{annualSavings})
                            </span>
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start max-w-4xl mx-auto">

                    {/* Pro Tier */}
                    <div className="border border-black bg-black text-white p-8 relative transform md:-translate-y-4 shadow-2xl">
                        <div className="absolute top-0 right-0 bg-[#FF4F00] text-white text-[10px] font-mono px-3 py-1 font-bold">
                            RECOMMENDED
                        </div>
                        <div className="font-mono text-xs text-[#FF4F00] mb-4 uppercase tracking-widest">PROFESSIONAL</div>
                        <h3 className="font-serif text-3xl font-bold mb-2">Pro</h3>
                        <div className="text-4xl font-mono font-bold mb-6">
                            {pricing.symbol}{price} <span className="text-base font-normal text-[#999]">/mo</span>
                        </div>
                        <p className="text-sm text-[#ccc] mb-8 min-h-[40px]">
                            For teams building compliant AI products at scale.
                        </p>
                        <button disabled className="block w-full text-center bg-[#FF4F00] text-white py-3 font-mono text-xs opacity-75 cursor-not-allowed">
                            COMING_SOON
                        </button>

                        <div className="mt-8 space-y-4">
                            <FeatureItem included dark>Unlimited Scans</FeatureItem>
                            <FeatureItem included dark>Private Repositories</FeatureItem>
                            <FeatureItem included dark>PDF Compliance Reports</FeatureItem>
                            <FeatureItem included dark>Context Verification</FeatureItem>
                            <FeatureItem included dark>GitHub Action Integration</FeatureItem>
                            <FeatureItem included dark>Priority Support</FeatureItem>
                        </div>
                    </div>

                    {/* Enterprise Tier */}
                    <div className="border border-black bg-white p-8 relative group hover:border-[#FF4F00] transition-colors">
                        <div className="font-mono text-xs text-[#999] mb-4 uppercase tracking-widest">ENTERPRISE</div>
                        <h3 className="font-serif text-3xl font-bold mb-2">Custom</h3>
                        <div className="text-4xl font-mono font-bold mb-6">
                            Talk to us
                        </div>
                        <p className="text-sm text-[#555] mb-8 min-h-[40px]">
                            For organizations with advanced security needs.
                        </p>
                        <button disabled className="block w-full text-center border border-black py-3 font-mono text-xs opacity-75 cursor-not-allowed bg-neutral-100 text-neutral-500">
                            COMING_SOON
                        </button>

                        <div className="mt-8 space-y-4">
                            <FeatureItem included>Everything in Pro</FeatureItem>
                            <FeatureItem included>Custom SSO / SAML</FeatureItem>
                            <FeatureItem included>Audit Logs</FeatureItem>
                            <FeatureItem included>Dedicated Success Manager</FeatureItem>
                            <FeatureItem included>Custom SLAs</FeatureItem>
                            <FeatureItem included>On-premise Deployment</FeatureItem>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t-2 border-black p-6 md:p-8 flex flex-col md:flex-row justify-between items-center bg-white">
                <div className="text-[10px] font-mono text-[#555] tracking-widest mb-8 md:mb-0">
                    LAW_V1.0 // EU_COMPLIANCE
                </div>
                <div className="flex gap-8 font-mono text-xs underline decoration-1 underline-offset-4">
                    <Link href="/legal/terms" className="hover:text-[#FF4F00]">TERMS</Link>
                    <Link href="/legal/privacy" className="hover:text-[#FF4F00]">PRIVACY</Link>
                    <Link href="/legal/security" className="hover:text-[#FF4F00]">SECURITY</Link>
                    <Link href="/legal/compliance" className="hover:text-[#FF4F00]">EU_DISCLAIMER</Link>
                </div>
            </footer>
        </div>
    );
}

function FeatureItem({ children, included = true, dark = false }: { children: React.ReactNode, included?: boolean, dark?: boolean }) {
    return (
        <div className={`flex items-start gap-3 text-sm ${!included ? 'opacity-50' : ''}`}>
            {included ? (
                <Check className={`w-4 h-4 mt-0.5 ${dark ? 'text-[#FF4F00]' : 'text-black'}`} />
            ) : (
                <X className="w-4 h-4 mt-0.5" />
            )}
            <span className={`font-mono ${dark ? 'text-gray-300' : 'text-gray-600'}`}>
                {children}
            </span>
        </div>
    );
}
