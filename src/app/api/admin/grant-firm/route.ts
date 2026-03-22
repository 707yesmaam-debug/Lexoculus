import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/infra/prisma';
import { TIER_LIMITS } from '@/lib/platform/subscription';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const adminKey = process.env.ADMIN_API_KEY;

        if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { email, clientSeats = 1 } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { active_firm: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.account_type !== 'firm') {
            return NextResponse.json({ error: 'User is not a law firm' }, { status: 400 });
        }

        // Grant the subscription
        const subscription = await prisma.subscription.upsert({
            where: { user_id: user.id },
            create: {
                user_id: user.id,
                tier: 'pro',
                status: 'active',
                payment_provider: 'manual_grant',
                payment_customer_id: 'manual',
                payment_subscription_id: `manual_${Date.now()}`,
                client_limit: clientSeats, // Set purchased seats
                repos_limit: TIER_LIMITS.pro.repos_limit * clientSeats,
                scans_limit: TIER_LIMITS.pro.scans_limit * clientSeats,
                pr_scans_limit: TIER_LIMITS.pro.pr_scans_limit * clientSeats,
                reports_limit: TIER_LIMITS.pro.reports_limit * clientSeats,
            },
            update: {
                tier: 'pro',
                status: 'active',
                payment_provider: 'manual_grant',
                client_limit: clientSeats,
                repos_limit: TIER_LIMITS.pro.repos_limit * clientSeats,
                scans_limit: TIER_LIMITS.pro.scans_limit * clientSeats,
                pr_scans_limit: TIER_LIMITS.pro.pr_scans_limit * clientSeats,
                reports_limit: TIER_LIMITS.pro.reports_limit * clientSeats,
            }
        });

        return NextResponse.json({
            message: 'Firm subscription granted successfully',
            user: user.email,
            firm: user.active_firm?.firm_id,
            seats: subscription.client_limit
        });

    } catch (error: any) {
        console.error('Error granting firm subscription:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
