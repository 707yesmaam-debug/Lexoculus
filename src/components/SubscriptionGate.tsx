'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isCheckoutSuccess = searchParams.get('checkout') === 'success';

    const [isLoading, setIsLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);
    const [isPolling, setIsPolling] = useState(false);

    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 15; // 30 seconds max
        let pollingInterval: NodeJS.Timeout;

        const checkSubscription = async () => {
            try {
                // 1. Check Session
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setIsAllowed(false);
                    return; // Middleware/Layout handles redirect usually
                }

                // 2. Fetch Subscription Status
                const res = await fetch('/api/subscription');
                if (!res.ok) throw new Error('Failed to fetch subscription');

                const data = await res.json();
                const tier = data.subscription?.tier;

                // 3. Logic: Only allow 'pro' or 'enterprise'
                if (tier === 'pro' || tier === 'enterprise') {
                    setIsAllowed(true);
                    setIsPolling(false);
                    setIsLoading(false);
                    if (pollingInterval) clearInterval(pollingInterval);
                } else {
                    // If we just came from checkout, start polling instead of redirecting immediately
                    if (isCheckoutSuccess && attempts < maxAttempts) {
                        setIsPolling(true);
                        // Don't redirect yet, just keep loading/polling
                    } else {
                        console.log('User is on free tier. Redirecting to pricing.');
                        router.push('/pricing?reason=subscription_required');
                    }
                }
            } catch (error) {
                console.error('Subscription check failed:', error);
                router.push('/pricing?error=check_failed');
            } finally {
                if (!isPolling) setIsLoading(false);
            }
        };

        // Initial check
        checkSubscription();

        // Setup polling if needed
        if (isCheckoutSuccess) {
            pollingInterval = setInterval(() => {
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(pollingInterval);
                    setIsPolling(false);
                    // Final attempt failed, redirect
                    router.push('/pricing?error=activation_timeout');
                } else {
                    checkSubscription();
                }
            }, 2000);
        }

        return () => {
            if (pollingInterval) clearInterval(pollingInterval);
        };
    }, [router, pathname, isCheckoutSuccess]);

    if (isLoading || isPolling) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in">
                {isPolling ? (
                    <>
                        <Loader2 className="w-10 h-10 animate-spin text-[#FF4F00] mb-6" />
                        <div className="font-mono text-sm font-bold uppercase tracking-widest mb-2">FINALIZING_SETUP</div>
                        <div className="text-gray-500 text-xs font-mono max-w-xs text-center">
                            Verifying payment confirmation from the blockchain...
                            <br />
                            (This may take a few seconds)
                        </div>
                    </>
                ) : (
                    <>
                        <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
                        <div className="font-mono text-xs text-[#555]">VERIFYING_ACCESS_RIGHTS...</div>
                    </>
                )}
            </div>
        );
    }

    if (!isAllowed) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
