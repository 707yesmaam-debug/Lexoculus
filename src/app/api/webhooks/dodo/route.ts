import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { dodo } from '@/lib/dodo';
import { prisma } from '@/lib/prisma';

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
            case 'subscription.failed':
            case 'subscription.expired':
                await handleSubscriptionCancellation(event.data);
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
        },
    });

    console.log(`Updated subscription for user ${user.id}`);
}

async function handleSubscriptionCancellation(data: any) {
    const customerEmail = data.customer?.email;
    if (!customerEmail) return;

    const user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) return;

    await prisma.subscription.update({
        where: { user_id: user.id },
        data: {
            status: 'canceled', // or whatever status passed
            cancel_at_period_end: true,
            // We usually keep the tier 'pro' until the period ends, 
            // but standardizing to status update is safer.
        },
    });

    console.log(`Cancelled subscription for user ${user.id}`);
}
