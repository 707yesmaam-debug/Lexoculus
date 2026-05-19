'use client';

import { Check, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface SubscriptionSectionProps {
    subscription: {
        tier: string | null;
        status: string | null;
        current_period_end: Date | null;
        limits: {
            scans: number | null;
            repos: number | null;
        };
        usage: {
            scans: number | null;
            repos: number | null;
        };
        has_payment_method?: boolean;
    } | null;
}

export default function SubscriptionSection({ subscription }: SubscriptionSectionProps) {
    const isPro = subscription?.tier === 'pro' || subscription?.tier === 'enterprise';
    const scanLimit = subscription?.limits.scans || 5;
    const scanUsage = subscription?.usage.scans || 0;
    const isUnlimited = scanLimit >= 999999;
    const scanPercentage = isUnlimited ? 100 : Math.min((scanUsage / scanLimit) * 100, 100);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-serif font-bold mb-2">Subscription & Usage</h2>
                <p className="text-gray-500 text-sm font-mono">MANAGE_YOUR_PLAN</p>
            </div>

            <Separator className="bg-gray-200" />

            {/* CURRENT PLAN CARD */}
            <div className="border border-black p-6 bg-gray-50">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="font-mono text-xs uppercase tracking-wider text-gray-500 mb-1">Current Plan</div>
                        <div className="text-3xl font-bold font-serif flex items-center gap-3">
                            {subscription?.tier === 'pro' ? 'PRO LICENSE' : 'FREE TIER'}
                            {isPro && <span className="bg-[#FF4F00] text-white text-[10px] font-mono px-2 py-0.5 uppercase tracking-widest leading-none">ACTIVE</span>}
                        </div>
                    </div>
                    {isPro ? (
                        <div className="text-right">
                            <div className="font-mono text-xs uppercase tracking-wider text-gray-500 mb-1">Renewal Date</div>
                            <div className="font-mono text-sm">
                                {subscription?.current_period_end
                                    ? new Date(subscription.current_period_end).toLocaleDateString()
                                    : 'N/A'
                                }
                            </div>
                        </div>
                    ) : (
                        <Button
                            className="bg-[#FF4F00] hover:bg-[#E04500] text-white font-mono text-xs uppercase tracking-widest"
                            onClick={() => window.location.href = '/pricing'}
                        >
                            UPGRADE_TO_PRO
                        </Button>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Usage Progress */}
                    <div>
                        <div className="flex justify-between font-mono text-xs mb-2">
                            <span>SCAN_CREDITS</span>
                            <span>{scanUsage} / {isUnlimited ? 'UNLIMITED' : scanLimit}</span>
                        </div>
                        {!isUnlimited && (
                            <Progress value={scanPercentage} className="h-2 bg-gray-200" indicatorClassName="bg-black" />
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-600" />
                            <span>Full Scan History</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-green-600" />
                            <span>PDF Compliance Reports</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BILLING PORTAL */}
            {isPro && subscription?.has_payment_method && (
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        className="border-black text-black hover:bg-black hover:text-white font-mono text-xs uppercase tracking-widest"
                        onClick={async () => {
                            try {
                                const res = await fetch('/api/user/billing');
                                const data = await res.json();
                                if (data.url) {
                                    window.location.href = data.url;
                                } else {
                                    alert('Failed to load billing portal. Please contact support.');
                                }
                            } catch (e) {
                                console.error(e);
                                alert('Error loading billing portal');
                            }
                        }}
                    >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        MANAGE_BILLING
                    </Button>
                </div>
            )}

            {isPro && !subscription?.has_payment_method && (
                <div className="flex justify-end">
                    <div className="text-xs font-mono text-gray-500 bg-gray-100 px-3 py-2 border border-gray-200">
                        MANAGED_BY_ADMIN
                    </div>
                </div>
            )}

            <div className="bg-blue-50 border border-blue-100 p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="font-mono text-xs font-bold text-blue-800 mb-1">NEED_ASSISTANCE?</h4>
                        <p className="text-sm text-blue-700">
                            For billing inquiries or enterprise licensing, please contact <a href="mailto:varadkhoriya17@gmail.com" className="underline hover:text-blue-900">varadkhoriya17@gmail.com</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
