/**
 * Pricing Page
 * 
 * Display subscription tiers and allow upgrade to Pro
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PricingTier {
    name: string;
    price: number;
    currency: string;
    period: string;
    description: string;
    cta: string;
    highlighted: boolean;
}

interface SubscriptionStatus {
    tier: string;
    status: string;
    is_pro: boolean;
}

export default function PricingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
    const [pricing, setPricing] = useState<Record<string, PricingTier>>({});
    const [upgrading, setUpgrading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await fetch('/api/subscription');
            if (res.ok) {
                const data = await res.json();
                setSubscription(data.subscription);
                setPricing(data.pricing);
            }
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (tier: string) => {
        if (tier === 'enterprise') {
            window.location.href = 'mailto:sales@complianceai.eu?subject=Enterprise%20Inquiry';
            return;
        }

        setUpgrading(true);
        setMessage(null);

        try {
            // Try Stripe checkout first
            const res = await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'checkout', tier }),
            });

            const data = await res.json();

            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                // Stripe not configured - offer manual grant for demo
                setMessage({
                    type: 'error',
                    text: data.error || 'Checkout not available. Click below to request Pro access.',
                });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to start checkout' });
        } finally {
            setUpgrading(false);
        }
    };

    const handleManualGrant = async () => {
        setUpgrading(true);
        try {
            const res = await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'grant_pro', reason: 'Self-requested from pricing page' }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: '🎉 Pro subscription activated for 30 days!' });
                await fetchSubscription();
                setTimeout(() => router.push('/dashboard/scanner'), 2000);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to activate Pro' });
        } finally {
            setUpgrading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    const tiers = ['free', 'pro', 'enterprise'];

    return (
        <div className="min-h-screen bg-gray-950 py-16 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        EU AI Act compliance at every stage of your development lifecycle
                    </p>
                    {subscription?.is_pro && (
                        <div className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 rounded-full text-cyan-400">
                            <span className="mr-2">✨</span>
                            You're on the {subscription.tier.toUpperCase()} plan
                        </div>
                    )}
                </div>

                {/* Message */}
                {message && (
                    <div className={`max-w-md mx-auto mb-8 p-4 rounded-lg text-center ${message.type === 'success'
                            ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                            : 'bg-red-500/20 border border-red-500/50 text-red-400'
                        }`}>
                        {message.text}
                        {message.type === 'error' && !subscription?.is_pro && (
                            <button
                                onClick={handleManualGrant}
                                disabled={upgrading}
                                className="mt-3 block w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50"
                            >
                                {upgrading ? 'Activating...' : '🚀 Activate Pro Trial (30 days)'}
                            </button>
                        )}
                    </div>
                )}

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8">
                    {tiers.map((tierKey) => {
                        const tier = pricing[tierKey] || {};
                        const isCurrentTier = subscription?.tier === tierKey;
                        const isHighlighted = tier.highlighted;

                        return (
                            <div
                                key={tierKey}
                                className={`relative rounded-2xl p-8 ${isHighlighted
                                        ? 'bg-gradient-to-b from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500'
                                        : 'bg-gray-900/50 border border-gray-800'
                                    }`}
                            >
                                {isHighlighted && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-sm font-semibold text-white">
                                        Most Popular
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {tier.name || tierKey}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        {tier.description}
                                    </p>
                                    <div className="flex items-end justify-center gap-1">
                                        <span className="text-5xl font-bold text-white">
                                            €{tier.price || 0}
                                        </span>
                                        <span className="text-gray-400 mb-2">
                                            /{tier.period || 'month'}
                                        </span>
                                    </div>
                                </div>

                                {/* Features */}
                                <ul className="space-y-4 mb-8">
                                    {tierKey === 'free' && (
                                        <>
                                            <Feature included>1 repository scan</Feature>
                                            <Feature included>5 scans per month</Feature>
                                            <Feature included>1 PDF report per month</Feature>
                                            <Feature>GitHub Action PR scanning</Feature>
                                            <Feature>Slack notifications</Feature>
                                            <Feature>API access</Feature>
                                        </>
                                    )}
                                    {tierKey === 'pro' && (
                                        <>
                                            <Feature included>10 repositories</Feature>
                                            <Feature included>100 scans per month</Feature>
                                            <Feature included>20 PDF reports per month</Feature>
                                            <Feature included>GitHub Action PR scanning</Feature>
                                            <Feature included>Slack notifications</Feature>
                                            <Feature>API access</Feature>
                                        </>
                                    )}
                                    {tierKey === 'enterprise' && (
                                        <>
                                            <Feature included>Unlimited repositories</Feature>
                                            <Feature included>Unlimited scans</Feature>
                                            <Feature included>Unlimited PDF reports</Feature>
                                            <Feature included>GitHub Action PR scanning</Feature>
                                            <Feature included>Slack notifications</Feature>
                                            <Feature included>API access</Feature>
                                            <Feature included>Custom constraints</Feature>
                                            <Feature included>Priority support</Feature>
                                        </>
                                    )}
                                </ul>

                                {/* CTA Button */}
                                <button
                                    onClick={() => handleUpgrade(tierKey)}
                                    disabled={isCurrentTier || upgrading}
                                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${isCurrentTier
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : isHighlighted
                                                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90'
                                                : 'bg-gray-800 text-white hover:bg-gray-700'
                                        }`}
                                >
                                    {isCurrentTier ? 'Current Plan' : tier.cta || 'Select'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ or Additional Info */}
                <div className="mt-16 text-center">
                    <p className="text-gray-400">
                        Questions? Contact us at{' '}
                        <a href="mailto:support@complianceai.eu" className="text-cyan-400 hover:underline">
                            support@complianceai.eu
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

function Feature({ children, included = false }: { children: React.ReactNode; included?: boolean }) {
    return (
        <li className="flex items-center gap-3">
            {included ? (
                <span className="text-cyan-400">✓</span>
            ) : (
                <span className="text-gray-600">✗</span>
            )}
            <span className={included ? 'text-gray-300' : 'text-gray-500'}>
                {children}
            </span>
        </li>
    );
}
