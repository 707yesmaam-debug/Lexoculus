const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching active subscriptions...');

    const subscriptions = await prisma.subscription.findMany({
        where: {
            tier: 'pro'
        }
    });

    console.log(`Found ${subscriptions.length} subscriptions.`);

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
    }

    console.log('✅ Updated subscriptions to unlimited.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
