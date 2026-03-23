const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const usersWithSubs = await prisma.user.findMany({
            orderBy: { created_at: 'desc' },
            take: 5,
            include: {
                subscription: true
            }
        });
        console.log('--- RECENT USERS & SUBSCRIPTIONS ---');
        console.log(JSON.stringify(usersWithSubs, null, 2));
    } catch (err) {
        console.error('Query failed:', err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
