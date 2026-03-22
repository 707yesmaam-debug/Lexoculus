import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

async function checkUser() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is missing');
        return;
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const email = 'hocofem633@soco7.com';
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                firm_member: {
                    include: {
                        firm: true
                    }
                },
                subscription: true
            }
        });

        console.log('User Record:', JSON.stringify(user, null, 2));
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

checkUser().catch(console.error);
