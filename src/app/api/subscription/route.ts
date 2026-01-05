/**
 * Subscription API
 * 
 * Manage user subscriptions, check usage, and handle upgrades.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import {
    getUsageStatus,
    checkUsageLimit,
    grantProSubscription,
    createCheckoutSession,
    getCustomerPortalUrl,
    PRICING,
    TIER_LIMITS,
} from '@/lib/subscription';

/**
 * GET /api/subscription
 * 
 * Get current user's subscription and usage status
 */
export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const status = await getUsageStatus(user.id);

        return NextResponse.json({
            subscription: {
                tier: status.tier,
                status: status.status,
                is_pro: status.is_pro,
                can_use_github_action: status.can_use_github_action,
            },
            limits: status.limits,
            usage: status.usage,
            remaining: status.remaining,
            reset_at: status.reset_at,
            pricing: PRICING,
        });

    } catch (error) {
        console.error('Get subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to get subscription' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/subscription
 * 
 * Create checkout session or grant manual Pro access
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { action, tier, reason } = body;

        // Manual grant (for admins/demos)
        if (action === 'grant_pro') {
            // In production, you'd check if user is admin
            // For now, allow self-grant for demo purposes
            await grantProSubscription(
                user.id,
                reason || 'Self-granted for demo',
                user.id,
                30 // 30 days
            );

            return NextResponse.json({
                success: true,
                message: 'Pro subscription granted for 30 days',
            });
        }

        // Check usage limit
        if (action === 'check_limit') {
            const { resource } = body;
            const result = await checkUsageLimit(user.id, resource);
            return NextResponse.json(result);
        }

        // Create Stripe checkout (placeholder)
        if (action === 'checkout') {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const result = await createCheckoutSession(
                user.id,
                tier || 'pro',
                `${appUrl}/dashboard?upgrade=success`,
                `${appUrl}/pricing?upgrade=canceled`
            );

            if (result.error) {
                return NextResponse.json({
                    success: false,
                    error: result.error,
                    fallback: 'Contact support@complianceai.eu for Pro access',
                });
            }

            return NextResponse.json({
                success: true,
                checkout_url: result.url,
            });
        }

        // Get customer portal (placeholder)
        if (action === 'portal') {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const result = await getCustomerPortalUrl(
                user.id,
                `${appUrl}/dashboard`
            );

            if (result.error) {
                return NextResponse.json({
                    success: false,
                    error: result.error,
                });
            }

            return NextResponse.json({
                success: true,
                portal_url: result.url,
            });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Subscription action error:', error);
        return NextResponse.json(
            { error: 'Subscription action failed' },
            { status: 500 }
        );
    }
}
