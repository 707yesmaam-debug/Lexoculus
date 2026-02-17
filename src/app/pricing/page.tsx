'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Check, X, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { PRICING_CONFIG } from '@/lib/pricing-config';
import OpticalLogo from '@/components/OpticalLogo';
import { useSearchParams } from 'next/navigation';

// ... imports

function PricingContent() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    // Removed region state as strict EUR pricing is enforced
    const pricing = PRICING_CONFIG;

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason');
    const error = searchParams.get('error');
    const [showAlert, setShowAlert] = useState(!!reason || !!error);

    useEffect(() => {
        // Auto-dismiss alert
        if (showAlert) {
            const timer = setTimeout(() => setShowAlert(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showAlert]);

    useEffect(() => {
        // Check session
        import('@/lib/supabase').then(({ createClient }) => {
            const supabase = createClient();
            supabase.auth.getSession().then(({ data: { session } }) => {
                setIsLoggedIn(!!session);
            });
        });
    }, []);

    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        if (!isLoggedIn) {
            window.location.href = '/auth/signup';
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/subscription/checkout', {
                method: 'POST',
            });
            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Checkout initialization failed. Please try again.');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
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
                                    Purchase
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">

                {/* Alert Banner */}
                {showAlert && (
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
                        <div className="bg-black text-white px-6 py-4 shadow-lg flex items-center gap-4 border border-white/20 min-w-[320px]">
                            <AlertCircle className="w-5 h-5 shrink-0 text-[#FF4F00]" />
                            <div className="font-mono text-xs">
                                <div className="font-bold uppercase mb-1 text-[#FF4F00]">ACCESS_DENIED</div>
                                {reason === 'subscription_required'
                                    ? 'ACTIVE_SUBSCRIPTION_REQUIRED_FOR_ENTRY'
                                    : 'AUTHENTICATION_SEQUENCE_FAILED'}
                            </div>
                            <button
                                onClick={() => setShowAlert(false)}
                                className="ml-auto hover:bg-white/20 p-1 transition-colors rounded-full"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                <div className="text-center mb-16">
                    <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                        Predictable pricing for <br /> <span className="text-[#FF4F00]">compliance at scale.</span>
                    </h1>
                    <p className="text-[#555] mb-8 max-w-2xl mx-auto">
                        Start your compliance journey. Upgrade for unlimited analysis and context verification.
                    </p>

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
                        <button
                            onClick={handleUpgrade}
                            disabled={isLoading}
                            className="block w-full text-center bg-[#FF4F00] text-white py-3 font-mono text-xs hover:bg-[#CC4000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'PROCESSING...' : 'PURCHASE_LICENSE'}
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

export default function PricingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F5F5F5]" />}>
            <PricingContent />
        </Suspense>
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
