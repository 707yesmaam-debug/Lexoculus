import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

async function run() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is missing');
        process.exit(1);
    }
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        await prisma.user.update({
            where: { email: 'hocofem633@soco7.com' },
            data: { account_type: 'firm' }
        });
        console.log('Fixed account type for hocofem633@soco7.com');
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

run().catch(console.error);
