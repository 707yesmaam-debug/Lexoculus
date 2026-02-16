'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        const checkSubscription = async () => {
            try {
                // 1. Check Session
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    // Not logged in - let Middleware handle, or redirect
                    // Usually handled by layout/middleware, but safe to ignore here
                    setIsAllowed(false);
                    return;
                }

                // 2. Fetch Subscription Status
                const res = await fetch('/api/subscription');
                if (!res.ok) {
                    throw new Error('Failed to fetch subscription');
                }

                const data = await res.json();
                const tier = data.subscription?.tier;

                // 3. Logic: Only allow 'pro' or 'enterprise'
                if (tier === 'pro' || tier === 'enterprise') {
                    setIsAllowed(true);
                } else {
                    console.log('User is on free tier. Redirecting to pricing.');
                    // Redirect to pricing with a reason
                    router.push('/pricing?reason=subscription_required');
                }
            } catch (error) {
                console.error('Subscription check failed:', error);
                // Fallback: Block access on error to be safe? Or allow?
                // For a strict paywall, block.
                router.push('/pricing?error=check_failed');
            } finally {
                setIsLoading(false);
            }
        };

        checkSubscription();
    }, [router, pathname]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
                <div className="font-mono text-xs text-[#555]">VERIFYING_ACCESS_RIGHTS...</div>
            </div>
        );
    }

    if (!isAllowed) {
        return null; // Will redirect
    }

    return <>{children}</>;
}
