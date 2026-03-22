/**
 * Subscription Service
 * 
 * Manages user subscriptions, tier gating, and usage limits.
 * Payment-ready: includes fields for payment integration when credentials are available.
 */

import prisma from '../infra/prisma';
import logger from '../infra/logger';

// =============================================================================
// TYPES
// =============================================================================

export type SubscriptionTier = 'pro' | 'enterprise' | 'unpaid';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid';

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
        team_size: number;
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
export const TIER_LIMITS: Record<'pro' | 'enterprise', TierLimits> = {
    pro: {
        repos_limit: 5,
        scans_limit: 30,
        pr_scans_limit: 50,
        reports_limit: 20,
        features: {
            github_action: true,
            slack_notifications: true,
            pdf_reports: true,
            api_access: true,
            priority_support: true,
            custom_constraints: true,
            team_size: 10,
        },
    },
    enterprise: {
        repos_limit: 999999,
        scans_limit: 999999,
        pr_scans_limit: 999999,
        reports_limit: 999999,
        features: {
            github_action: true,
            slack_notifications: true,
            pdf_reports: true,
            api_access: true,
            priority_support: true,
            custom_constraints: true,
            team_size: 999,
        },
    },
};

// =============================================================================
// PRICING CONFIGURATION (Base - see specific components for regional overrides)
// =============================================================================

export const PRICING = {
    pro: {
        name: 'Pro',
        price: 99,        // Base reference (EUR)
        yearly_price: 999,// EU Yearly
        currency: 'EUR',  // Default display
        period: 'month',
        description: 'For teams building AI products',
        cta: 'Upgrade to Pro',
        highlighted: true,
        payment_price_id: process.env.DODO_PAYMENTS_PRODUCT_ID_PRO || 'price_pro_placeholder',
    },
    enterprise: {
        name: 'Enterprise',
        price: 0, // Custom
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
 * Get existing subscription for a user.
 * Returns null if no subscription exists (user hasn't paid yet).
 * Subscriptions are only created by:
 *   1. Dodo Payments webhook (after successful payment)
 *   2. Manual grant via grantProSubscription()
 */
export async function getSubscription(userId: string) {
    return await prisma.subscription.findUnique({
        where: { user_id: userId },
    });
}

/**
 * @deprecated Use getSubscription() instead. Kept for backward compatibility.
 */
export async function getOrCreateSubscription(userId: string, email?: string, fullName?: string) {
    return await getSubscription(userId);
}

/**
 * Get user's current usage status.
 * Returns 'unpaid' status if no subscription exists.
 */
export async function getUsageStatus(userId: string, email?: string): Promise<UsageStatus> {
    const subscription = await getSubscription(userId);

    // No subscription = user hasn't paid yet
    if (!subscription) {
        const zeroLimits: TierLimits = {
            repos_limit: 0, scans_limit: 0, pr_scans_limit: 0, reports_limit: 0,
            features: {
                github_action: false, slack_notifications: false, pdf_reports: false,
                api_access: false, priority_support: false, custom_constraints: false, team_size: 0,
            },
        };
        return {
            tier: 'unpaid' as SubscriptionTier,
            status: 'unpaid' as SubscriptionStatus,
            limits: zeroLimits,
            usage: { repos_used: 0, scans_used: 0, pr_scans_used: 0, reports_used: 0 },
            remaining: { repos: 0, scans: 0, pr_scans: 0, reports: 0 },
            reset_at: new Date(),
            is_pro: false,
            can_use_github_action: false,
        };
    }

    const tier = subscription.tier as SubscriptionTier;
    const limits = { ...TIER_LIMITS[tier as 'pro' | 'enterprise'] };

    // Override limits with actual DB values (handles manual grants/overrides)
    limits.repos_limit = subscription.repos_limit ?? TIER_LIMITS[tier as 'pro' | 'enterprise'].repos_limit;
    limits.scans_limit = subscription.scans_limit ?? TIER_LIMITS[tier as 'pro' | 'enterprise'].scans_limit;
    limits.pr_scans_limit = subscription.pr_scans_limit ?? TIER_LIMITS[tier as 'pro' | 'enterprise'].pr_scans_limit;
    limits.reports_limit = subscription.reports_limit ?? TIER_LIMITS[tier as 'pro' | 'enterprise'].reports_limit;

    // Check if usage needs reset (monthly)
    const now = new Date();
    const resetDate = subscription.usage_reset_at ? new Date(subscription.usage_reset_at) : new Date();
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
            repos_used: subscription.repos_used ?? 0,
            scans_used: subscription.scans_used ?? 0,
            pr_scans_used: subscription.pr_scans_used ?? 0,
            reports_used: subscription.reports_used ?? 0,
        },
        remaining: {
            repos: Math.max(0, limits.repos_limit - (subscription.repos_used ?? 0)),
            scans: Math.max(0, limits.scans_limit - (subscription.scans_used ?? 0)),
            pr_scans: Math.max(0, limits.pr_scans_limit - (subscription.pr_scans_used ?? 0)),
            reports: Math.max(0, limits.reports_limit - (subscription.reports_used ?? 0)),
        },
        reset_at: subscription.usage_reset_at ?? new Date(),
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
        reason: allowed ? undefined : `Monthly limit of ${limit} ${name} reached. Contact support for more.`,
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
            client_limit: 1, // Grant 1 seat by default for testing
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
            client_limit: 1, // Grant 1 seat by default for testing
            is_manual_grant: true,
            manual_grant_reason: reason,
            granted_by: grantedBy,
            current_period_start: now,
            current_period_end: periodEnd,
        },
    });

    logger.info({
        event: 'pro_grant',
        userId,
        durationDays,
        reason
    }, `[SUCCESS] [SUBSCRIPTION] Granted Pro to ${userId}`);
}

/**
 * Revoke elevated subscription (reset to default pro limits)
 */
export async function revokeElevatedSubscription(userId: string): Promise<void> {
    await prisma.subscription.update({
        where: { user_id: userId },
        data: {
            tier: 'pro',
            status: 'active',
            repos_limit: TIER_LIMITS.pro.repos_limit,
            scans_limit: TIER_LIMITS.pro.scans_limit,
            pr_scans_limit: TIER_LIMITS.pro.pr_scans_limit,
            reports_limit: TIER_LIMITS.pro.reports_limit,
            is_manual_grant: false,
            manual_grant_reason: null,
            granted_by: null,
        },
    });

    logger.info({ event: 'subscription_revoke', userId }, `[BLOCKED] [SUBSCRIPTION] Revoked elevated subscription from ${userId}`);
}

// =============================================================================
// DODO PAYMENTS IMPLEMENTATION
// =============================================================================

import { dodo, DODO_PRODUCT_ID_PRO, DODO_PRODUCT_ID_PRO_YEARLY } from './dodo';

/**
 * Create Dodo checkout session for Pro subscription
 */
export async function createCheckoutSession(
    userId: string,
    userEmail: string,
    userName?: string,
    returnUrl: string = `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
): Promise<{ url: string | null; error?: string }> {
    try {
        const productId = billingCycle === 'yearly' ? DODO_PRODUCT_ID_PRO_YEARLY : DODO_PRODUCT_ID_PRO;

        if (!productId) {
            logger.warn(`[WARN] [DODO] No product ID configured for ${billingCycle} cycle`);
            return { url: null, error: `Payment for ${billingCycle} plan is not configured yet.` };
        }

        const session = await dodo.checkoutSessions.create({
            product_cart: [{
                product_id: productId,
                quantity: 1,
            }],
            customer: {
                email: userEmail,
                name: userName,
            },
            // billing_address: {
            //     country: 'US', // Removed to allow user selection
            // },
            return_url: returnUrl,
            metadata: {
                userId: userId,
            },
        });

        return { url: session.checkout_url ?? null };
    } catch (error: any) {
        logger.error({ error: error.message, userId }, '[ERROR] [DODO] Failed to create checkout session');
        return { url: null, error: error.message || 'Failed to initiate checkout.' };
    }
}

/**
 * Create Dodo checkout session for Firm subscription (Seat-based)
 */
export async function createFirmCheckoutSession(
    userId: string,
    userEmail: string,
    quantity: number,
    userName?: string,
    returnUrl: string = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/firm/settings/billing?checkout=success`
): Promise<{ url: string | null; error?: string }> {
    try {
        const productId = process.env.DODO_FIRM_PRODUCT_ID;

        if (!productId) {
            logger.warn(`[WARN] [DODO] No firm product ID configured in ENV (DODO_FIRM_PRODUCT_ID)`);
            return { url: null, error: `Firm payment is not configured yet.` };
        }

        const session = await dodo.checkoutSessions.create({
            product_cart: [{
                product_id: productId,
                quantity: quantity,
            }],
            customer: {
                email: userEmail,
                name: userName,
            },
            return_url: returnUrl,
            metadata: {
                userId: userId,
            },
        });

        return { url: session.checkout_url ?? null };
    } catch (error: any) {
        logger.error({ error: error.message, userId }, '[ERROR] [DODO] Failed to create firm checkout session');
        return { url: null, error: error.message || 'Failed to initiate firm checkout.' };
    }
}

/**
 * Get Dodo customer portal URL
 */
export async function getCustomerPortalUrl(
    userId: string
): Promise<{ url: string | null; error?: string }> {
    const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
    });

    if (!subscription?.payment_customer_id) {
        return { url: null, error: 'No payment record found' };
    }

    try {
        const session = await dodo.customers.customerPortal.create(subscription.payment_customer_id);
        return { url: session.link };
    } catch (error: any) {
        logger.error({ error: error.message, userId }, '[ERROR] [DODO] Failed to create portal session');
        return { url: null, error: 'Failed to access billing portal.' };
    }
}
