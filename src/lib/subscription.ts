/**
 * Subscription Service
 * 
 * Manages user subscriptions, tier gating, and usage limits.
 * Stripe-ready: includes fields for Stripe integration when credentials are available.
 */

import prisma from './prisma';

// =============================================================================
// TYPES
// =============================================================================

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface TierLimits {
    repos_limit: number;
    scans_limit: number;
    pr_scans_limit: number;
    reports_limit: number;
    features: {
        github_action: boolean;
        slack_notifications: boolean;
        pdf_reports: boolean;
        api_access: boolean;
        priority_support: boolean;
        custom_constraints: boolean;
    };
}

export interface UsageStatus {
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    limits: TierLimits;
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
    reset_at: Date;
    is_pro: boolean;
    can_use_github_action: boolean;
}

// =============================================================================
// TIER LIMITS CONFIGURATION
// =============================================================================

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
    free: {
        repos_limit: 1,
        scans_limit: 5,
        pr_scans_limit: 0,
        reports_limit: 1,
        features: {
            github_action: false,
            slack_notifications: false,
            pdf_reports: false, // Up-sell to Pro
            api_access: false,
            priority_support: false,
            custom_constraints: false,
        },
    },
    pro: {
        repos_limit: 10,
        scans_limit: 100,
        pr_scans_limit: 999999, // Unlimited
        reports_limit: 20,
        features: {
            github_action: true,
            slack_notifications: true,
            pdf_reports: true,
            api_access: false,
            priority_support: false,
            custom_constraints: false,
        },
    },
    enterprise: {
        repos_limit: 999999, // Unlimited
        scans_limit: 999999, // Unlimited
        pr_scans_limit: 999999, // Unlimited
        reports_limit: 999999, // Unlimited
        features: {
            github_action: true,
            slack_notifications: true,
            pdf_reports: true,
            api_access: true,
            priority_support: true,
            custom_constraints: true,
        },
    },
};

// =============================================================================
// PRICING CONFIGURATION (for UI display)
// =============================================================================

export const PRICING = {
    free: {
        name: 'Free',
        price: 0,
        currency: 'EUR',
        period: 'forever',
        description: 'For trying out ComplianceAI',
        cta: 'Get Started',
        highlighted: false,
    },
    pro: {
        name: 'Pro',
        price: 49,
        currency: 'EUR',
        period: 'month',
        description: 'For teams building AI products',
        cta: 'Upgrade to Pro',
        highlighted: true,
        stripe_price_id: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
    },
    enterprise: {
        name: 'Enterprise',
        price: 199,
        currency: 'EUR',
        period: 'month',
        description: 'For organizations with custom needs',
        cta: 'Contact Sales',
        highlighted: false,
    },
};

// =============================================================================
// SUBSCRIPTION FUNCTIONS
// =============================================================================

/**
 * Get or create subscription for a user
 */
export async function getOrCreateSubscription(userId: string) {
    let subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
    });

    if (!subscription) {
        // Create free subscription
        subscription = await prisma.subscription.create({
            data: {
                user_id: userId,
                tier: 'free',
                status: 'active',
                repos_limit: TIER_LIMITS.free.repos_limit,
                scans_limit: TIER_LIMITS.free.scans_limit,
                pr_scans_limit: TIER_LIMITS.free.pr_scans_limit,
                reports_limit: TIER_LIMITS.free.reports_limit,
            },
        });
    }

    return subscription;
}

/**
 * Get user's current usage status
 */
export async function getUsageStatus(userId: string): Promise<UsageStatus> {
    const subscription = await getOrCreateSubscription(userId);
    const tier = subscription.tier as SubscriptionTier;
    const limits = TIER_LIMITS[tier];

    // Check if usage needs reset (monthly)
    const now = new Date();
    const resetDate = new Date(subscription.usage_reset_at);
    const shouldReset = now.getMonth() !== resetDate.getMonth() ||
        now.getFullYear() !== resetDate.getFullYear();

    if (shouldReset) {
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                repos_used: 0,
                scans_used: 0,
                pr_scans_used: 0,
                reports_used: 0,
                usage_reset_at: now,
            },
        });
        subscription.repos_used = 0;
        subscription.scans_used = 0;
        subscription.pr_scans_used = 0;
        subscription.reports_used = 0;
    }

    return {
        tier,
        status: subscription.status as SubscriptionStatus,
        limits,
        usage: {
            repos_used: subscription.repos_used,
            scans_used: subscription.scans_used,
            pr_scans_used: subscription.pr_scans_used,
            reports_used: subscription.reports_used,
        },
        remaining: {
            repos: Math.max(0, subscription.repos_limit - subscription.repos_used),
            scans: Math.max(0, subscription.scans_limit - subscription.scans_used),
            pr_scans: Math.max(0, subscription.pr_scans_limit - subscription.pr_scans_used),
            reports: Math.max(0, subscription.reports_limit - subscription.reports_used),
        },
        reset_at: subscription.usage_reset_at,
        is_pro: tier === 'pro' || tier === 'enterprise',
        can_use_github_action: limits.features.github_action,
    };
}

/**
 * Check if user can perform an action (with usage limit)
 */
export async function checkUsageLimit(
    userId: string,
    action: 'repo' | 'scan' | 'pr_scan' | 'report'
): Promise<{ allowed: boolean; remaining: number; limit: number; reason?: string }> {
    const status = await getUsageStatus(userId);

    const mapping: Record<string, { used: number; limit: number; name: string }> = {
        repo: { used: status.usage.repos_used, limit: status.limits.repos_limit, name: 'repositories' },
        scan: { used: status.usage.scans_used, limit: status.limits.scans_limit, name: 'repository scans' },
        pr_scan: { used: status.usage.pr_scans_used, limit: status.limits.pr_scans_limit, name: 'PR scans' },
        report: { used: status.usage.reports_used, limit: status.limits.reports_limit, name: 'reports' },
    };

    const { used, limit, name } = mapping[action];
    const remaining = Math.max(0, limit - used);
    const allowed = remaining > 0;

    return {
        allowed,
        remaining,
        limit,
        reason: allowed ? undefined : `Monthly limit of ${limit} ${name} reached. Upgrade to Pro for more.`,
    };
}

/**
 * Increment usage counter
 */
export async function incrementUsage(
    userId: string,
    action: 'repo' | 'scan' | 'pr_scan' | 'report'
): Promise<void> {
    const fieldMap = {
        repo: 'repos_used',
        scan: 'scans_used',
        pr_scan: 'pr_scans_used',
        report: 'reports_used',
    };

    await prisma.subscription.update({
        where: { user_id: userId },
        data: {
            [fieldMap[action]]: { increment: 1 },
        },
    });
}

/**
 * Manually grant Pro subscription (for early adopters, demos)
 */
export async function grantProSubscription(
    userId: string,
    reason: string,
    grantedBy: string,
    durationDays: number = 30
): Promise<void> {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await prisma.subscription.upsert({
        where: { user_id: userId },
        update: {
            tier: 'pro',
            status: 'active',
            repos_limit: TIER_LIMITS.pro.repos_limit,
            scans_limit: TIER_LIMITS.pro.scans_limit,
            pr_scans_limit: TIER_LIMITS.pro.pr_scans_limit,
            reports_limit: TIER_LIMITS.pro.reports_limit,
            is_manual_grant: true,
            manual_grant_reason: reason,
            granted_by: grantedBy,
            current_period_start: now,
            current_period_end: periodEnd,
        },
        create: {
            user_id: userId,
            tier: 'pro',
            status: 'active',
            repos_limit: TIER_LIMITS.pro.repos_limit,
            scans_limit: TIER_LIMITS.pro.scans_limit,
            pr_scans_limit: TIER_LIMITS.pro.pr_scans_limit,
            reports_limit: TIER_LIMITS.pro.reports_limit,
            is_manual_grant: true,
            manual_grant_reason: reason,
            granted_by: grantedBy,
            current_period_start: now,
            current_period_end: periodEnd,
        },
    });

    console.log(`✅ [SUBSCRIPTION] Granted Pro to ${userId} for ${durationDays} days: ${reason}`);
}

/**
 * Revoke Pro subscription (revert to free)
 */
export async function revokeProSubscription(userId: string): Promise<void> {
    await prisma.subscription.update({
        where: { user_id: userId },
        data: {
            tier: 'free',
            status: 'active',
            repos_limit: TIER_LIMITS.free.repos_limit,
            scans_limit: TIER_LIMITS.free.scans_limit,
            pr_scans_limit: TIER_LIMITS.free.pr_scans_limit,
            reports_limit: TIER_LIMITS.free.reports_limit,
            is_manual_grant: false,
            manual_grant_reason: null,
            granted_by: null,
            stripe_customer_id: null,
            stripe_subscription_id: null,
            stripe_price_id: null,
        },
    });

    console.log(`🚫 [SUBSCRIPTION] Revoked Pro from ${userId}`);
}

// =============================================================================
// STRIPE-READY PLACEHOLDERS
// =============================================================================

/**
 * Create Stripe checkout session (placeholder - needs STRIPE_SECRET_KEY)
 */
export async function createCheckoutSession(
    userId: string,
    tier: 'pro' | 'enterprise',
    successUrl: string,
    cancelUrl: string
): Promise<{ url: string | null; error?: string }> {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
        // Return placeholder for demo
        console.log(`⚠️ [STRIPE] No STRIPE_SECRET_KEY - returning placeholder`);
        return {
            url: null,
            error: 'Stripe is not configured yet. Please contact support for Pro access.',
        };
    }

    // TODO: Implement actual Stripe checkout when credentials are available
    // const stripe = new Stripe(stripeKey);
    // const session = await stripe.checkout.sessions.create({...});
    // return { url: session.url };

    return {
        url: null,
        error: 'Stripe checkout not implemented yet.',
    };
}

/**
 * Handle Stripe webhook (placeholder - needs STRIPE_WEBHOOK_SECRET)
 */
export async function handleStripeWebhook(
    payload: string,
    signature: string
): Promise<{ success: boolean; error?: string }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.log(`⚠️ [STRIPE] No STRIPE_WEBHOOK_SECRET configured`);
        return { success: false, error: 'Stripe webhooks not configured' };
    }

    // TODO: Implement actual Stripe webhook handling when credentials are available
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    // switch (event.type) {...}

    return { success: false, error: 'Stripe webhook handling not implemented yet.' };
}

/**
 * Get Stripe customer portal URL (placeholder)
 */
export async function getCustomerPortalUrl(
    userId: string,
    returnUrl: string
): Promise<{ url: string | null; error?: string }> {
    const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
    });

    if (!subscription?.stripe_customer_id) {
        return { url: null, error: 'No Stripe customer found' };
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
        return { url: null, error: 'Stripe not configured' };
    }

    // TODO: Implement actual Stripe portal when credentials are available
    // const stripe = new Stripe(stripeKey);
    // const session = await stripe.billingPortal.sessions.create({...});
    // return { url: session.url };

    return { url: null, error: 'Stripe portal not implemented yet.' };
}
