'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Users, Plus, Loader2, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface SubscriptionData {
    tier: string;
    status: string;
    limits: {
        repos_limit: number;
        scans_limit: number;
        pr_scans_limit: number;
        reports_limit: number;
    };
    usage: {
        repos_used: number;
        scans_used: number;
        pr_scans_used: number;
        reports_used: number;
    };
    remaining: {
        repos: number;
        scans: number;
        pr_scans: number;
        reports: number;
    };
    reset_at: string;
    is_pro: boolean;
}

export default function FirmBillingPage() {
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [clientCount, setClientCount] = useState(0);
    const [clientLimit, setClientLimit] = useState(0);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [seatsToBuy, setSeatsToBuy] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [subRes, clientsRes] = await Promise.all([
                    fetch('/api/subscription/status'),
                    fetch('/api/firm/clients'),
                ]);

                if (subRes.ok) {
                    const subData = await subRes.json();
                    setSubscription(subData);
                }

                if (clientsRes.ok) {
                    const clientsData = await clientsRes.json();
                    setClientCount(clientsData.clients?.length || 0);
                    setClientLimit(clientsData.client_limit || 0);
                }
            } catch (error) {
                console.error('Failed to fetch billing data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleBuySeats = async () => {
        setCheckoutLoading(true);
        try {
            const res = await fetch('/api/subscription/checkout-firm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: seatsToBuy }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Failed to initiate checkout');
            }
        } catch (error) {
            alert('Something went wrong. Please try again.');
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF4F00]" />
            </div>
        );
    }

    const pricePerSeat = 149;
    const seatsUsed = clientCount;
    const seatsTotal = clientLimit;
    const capacityPercent = seatsTotal > 0 ? Math.round((seatsUsed / seatsTotal) * 100) : 0;

    return (
        <div className="p-8">
            <div className="border-b-2 border-black pb-6 mb-8">
                <h1 className="font-serif text-3xl font-bold text-black mb-2">Billing & Capacity.</h1>
                <p className="font-mono text-sm text-[#555]">
                    Manage your client seats and subscription.
                </p>
            </div>

            {/* Current Plan Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="font-mono text-xs uppercase tracking-widest text-[#999] mb-2">Plan</div>
                    <div className="font-serif text-2xl font-bold text-black">
                        {subscription?.tier === 'pro' ? 'FIRM PRO' : subscription?.tier?.toUpperCase() || 'UNPAID'}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        {subscription?.status === 'active' ? (
                            <><CheckCircle className="w-4 h-4 text-green-600" /><span className="font-mono text-xs text-green-600">ACTIVE</span></>
                        ) : (
                            <><AlertTriangle className="w-4 h-4 text-[#FF4F00]" /><span className="font-mono text-xs text-[#FF4F00]">INACTIVE</span></>
                        )}
                    </div>
                </div>

                <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="font-mono text-xs uppercase tracking-widest text-[#999] mb-2">Client Seats</div>
                    <div className="font-serif text-2xl font-bold text-black">
                        {seatsUsed} / {seatsTotal}
                    </div>
                    <div className="mt-2 w-full bg-[#E5E5E5] h-2">
                        <div
                            className={`h-2 transition-all ${capacityPercent >= 90 ? 'bg-[#FF4F00]' : 'bg-black'}`}
                            style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                        />
                    </div>
                    <div className="font-mono text-xs text-[#999] mt-1">{capacityPercent}% capacity used</div>
                </div>

                <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="font-mono text-xs uppercase tracking-widest text-[#999] mb-2">Monthly Cost</div>
                    <div className="font-serif text-2xl font-bold text-black">
                        €{seatsTotal * pricePerSeat}<span className="text-base font-normal text-[#555]">/mo</span>
                    </div>
                    <div className="font-mono text-xs text-[#999] mt-2">€{pricePerSeat} per client seat</div>
                </div>
            </div>

            {/* Buy More Seats */}
            <div className="bg-[#F5F5F5] border-2 border-black p-8 mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                        <Plus className="w-5 h-5" />
                    </div>
                    <h2 className="font-serif text-xl font-bold text-black">Purchase Additional Seats</h2>
                </div>
                <p className="font-mono text-sm text-[#555] mb-6">
                    Each seat unlocks monitoring for one additional client. Your billing cycle adjusts automatically.
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div>
                        <label className="font-mono text-xs uppercase tracking-widest text-[#555] block mb-2">
                            Number of Seats
                        </label>
                        <div className="flex items-center border-2 border-black">
                            <button
                                onClick={() => setSeatsToBuy(Math.max(1, seatsToBuy - 1))}
                                className="px-4 py-3 border-r-2 border-black hover:bg-black hover:text-white transition-colors font-mono font-bold"
                            >
                                −
                            </button>
                            <span className="px-6 py-3 font-mono text-lg font-bold min-w-[60px] text-center">
                                {seatsToBuy}
                            </span>
                            <button
                                onClick={() => setSeatsToBuy(seatsToBuy + 1)}
                                className="px-4 py-3 border-l-2 border-black hover:bg-black hover:text-white transition-colors font-mono font-bold"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div className="font-mono text-sm text-[#555]">
                        <span className="font-bold text-black text-lg">€{seatsToBuy * pricePerSeat}</span>/month additional
                    </div>
                    <button
                        onClick={handleBuySeats}
                        disabled={checkoutLoading}
                        className="bg-black text-white px-8 py-3 font-mono text-sm font-bold uppercase tracking-widest hover:bg-[#FF4F00] transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {checkoutLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>Purchase <ArrowRight className="w-4 h-4" /></>
                        )}
                    </button>
                </div>
            </div>

            {/* Usage Breakdown */}
            <div className="bg-white border-2 border-black p-8">
                <h2 className="font-serif text-xl font-bold text-black mb-6">Usage This Cycle</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Repos', used: subscription?.usage.repos_used || 0, limit: subscription?.limits.repos_limit || 0 },
                        { label: 'Scans', used: subscription?.usage.scans_used || 0, limit: subscription?.limits.scans_limit || 0 },
                        { label: 'PR Scans', used: subscription?.usage.pr_scans_used || 0, limit: subscription?.limits.pr_scans_limit || 0 },
                        { label: 'Reports', used: subscription?.usage.reports_used || 0, limit: subscription?.limits.reports_limit || 0 },
                    ].map((item) => (
                        <div key={item.label}>
                            <div className="font-mono text-xs uppercase tracking-widest text-[#999] mb-1">{item.label}</div>
                            <div className="font-serif text-lg font-bold text-black">{item.used} / {item.limit}</div>
                            <div className="mt-1 w-full bg-[#E5E5E5] h-1">
                                <div
                                    className="h-1 bg-black"
                                    style={{ width: `${item.limit > 0 ? Math.min((item.used / item.limit) * 100, 100) : 0}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                {subscription?.reset_at && (
                    <div className="font-mono text-xs text-[#999] mt-4 pt-4 border-t border-[#E5E5E5]">
                        Usage resets: {new Date(subscription.reset_at).toLocaleDateString()}
                    </div>
                )}
            </div>
        </div>
    );
}
