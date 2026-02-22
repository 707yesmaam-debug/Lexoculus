import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        console.log('Fetching active subscriptions...');

        const subscriptions = await prisma.subscription.findMany({
            where: {
                OR: [
                    { tier: 'pro' },
                    { tier: 'enterprise' }
                ]
            }
        });

        console.log(`Found ${subscriptions.length} subscriptions.`);
        let updatedCount = 0;

        for (const sub of subscriptions) {
            console.log(`Updating limits for user: ${sub.user_id}`);
            await prisma.subscription.update({
                where: { id: sub.id },
                data: {
                    repos_limit: 999999,
                    scans_limit: 999999,
                    pr_scans_limit: 999999,
                    reports_limit: Math.max(sub.reports_limit || 100, 100)
                }
            });
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${updatedCount} subscriptions to unlimited.`
        });
    } catch (error: any) {
        console.error('Error updating limits:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
