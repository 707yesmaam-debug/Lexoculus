import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching all active Pro and Enterprise subscriptions...');

    const subscriptions = await prisma.subscription.findMany({
        where: {
            OR: [
                { tier: 'pro' },
                { tier: 'enterprise' }
            ]
        }
    });

    console.log(`Found ${subscriptions.length} subscriptions to update.`);

    for (const sub of subscriptions) {
        console.log(`Updating subscription for user: ${sub.user_id}`);
        await prisma.subscription.update({
            where: { id: sub.id },
            data: {
                repos_limit: 999999,
                scans_limit: 999999,
                pr_scans_limit: 999999,
                // Keep reports limit at 100 unless it's explicitly higher
                reports_limit: Math.max(sub.reports_limit || 100, 100)
            }
        });
    }

    console.log('✅ Successfully updated all subscription limits to Unlimited (999999).');
}

main()
    .catch((e) => {
        console.error('❌ Error updating subscriptions:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
