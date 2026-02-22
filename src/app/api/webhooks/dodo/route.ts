import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { dodo } from '@/lib/dodo';
import { prisma } from '@/lib/prisma';
import { TIER_LIMITS } from '@/lib/subscription';

// Disable next.js body parsing (not needed in app router, just read text)
// But we need the raw body for signature verification.
export async function POST(req: Request) {
    try {
        const bodyText = await req.text();
        const headerPayload = await headers();

        // Convert headers to Record<string, string> for Dodo SDK
        const headerObj: Record<string, string> = {};
        headerPayload.forEach((value, key) => {
            headerObj[key] = value;
        });

        // Verify and unwrap event
        const event = dodo.webhooks.unwrap(bodyText, {
            headers: headerObj,
            key: process.env.DODO_PAYMENTS_WEBHOOK_SECRET || '',
        });

        console.log(`Dodo Webhook received: ${event.type}`);

        switch (event.type) {
            case 'payment.succeeded':
            case 'subscription.active':
            case 'subscription.renewed':
            case 'subscription.updated':
                await handleSubscriptionUpdate(event.data);
                break;

            case 'subscription.cancelled':
                await handleSubscriptionCancellation(event.data);
                break;

            case 'subscription.failed':
            case 'subscription.expired':
                await handleSubscriptionFailure(event.data);
                break;

            default:
                // Ignore other events
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Dodo Webhook Error:', error.message);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 400 }
        );
    }
}

async function handleSubscriptionUpdate(data: any) {
    // Data should be a Subscription object or contain one
    // Dodo payload structure for payment.succeeded might differ from subscription.active
    // But usually mapped to Subscription object by SDK types.

    // We expect data to have customer_id or email to identify user.
    // Dodo Subscription object has `customer: { customer_id, email, name }`

    const customerEmail = data.customer?.email;
    if (!customerEmail) {
        console.error('No customer email in webhook data');
        return;
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email: customerEmail },
    });

    if (!user) {
        console.error(`User not found for email: ${customerEmail}`);
        return;
    }

    // Upsert subscription
    await prisma.subscription.upsert({
        where: { user_id: user.id },
        create: {
            user_id: user.id,
            tier: 'pro', // Assuming only Pro plan for now
            status: 'active',
            payment_provider: 'dodo',
            payment_customer_id: data.customer.customer_id,
            payment_subscription_id: data.subscription_id,
            payment_product_id: data.product_id,
            current_period_end: new Date(data.next_billing_date),
            cancel_at_period_end: false,
            repos_limit: TIER_LIMITS.pro.repos_limit,
            scans_limit: TIER_LIMITS.pro.scans_limit,
            pr_scans_limit: TIER_LIMITS.pro.pr_scans_limit,
            reports_limit: TIER_LIMITS.pro.reports_limit,
        },
        update: {
            tier: 'pro',
            status: 'active',
            payment_provider: 'dodo',
            payment_customer_id: data.customer.customer_id,
            payment_subscription_id: data.subscription_id,
            payment_product_id: data.product_id,
            current_period_end: new Date(data.next_billing_date),
            cancel_at_period_end: false,
            repos_limit: TIER_LIMITS.pro.repos_limit,
            scans_limit: TIER_LIMITS.pro.scans_limit,
            pr_scans_limit: TIER_LIMITS.pro.pr_scans_limit,
            reports_limit: TIER_LIMITS.pro.reports_limit,
        },
    });

    console.log(`Updated subscription for user ${user.id}`);
}

async function handleSubscriptionCancellation(data: any) {
    const customerEmail = data.customer?.email;
    if (!customerEmail) return;

    const user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) return;

    // Voluntary cancellation: Keep access until period end
    await prisma.subscription.update({
        where: { user_id: user.id },
        data: {
            status: 'active', // Keep active until end
            cancel_at_period_end: true,
        },
    });

    console.log(`Scheduled cancellation for user ${user.id}`);
}

async function handleSubscriptionFailure(data: any) {
    const customerEmail = data.customer?.email;
    if (!customerEmail) return;

    const user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) return;

    // Payment failed or expired: Revoke access immediately
    await prisma.subscription.update({
        where: { user_id: user.id },
        data: {
            status: 'past_due',
            cancel_at_period_end: false,
        },
    });

    console.log(`Revoked subscription (failure/expired) for user ${user.id}`);
}
