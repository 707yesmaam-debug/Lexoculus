
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local from current directory (project root)
config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function checkLatestScan() {
    console.log('--- Checking Latest PR Scans ---');
    try {
        const scans = await prisma.pRScan.findMany({
            orderBy: { scanned_at: 'desc' },
            take: 3,
            include: {
                user: {
                    select: { email: true }
                }
            }
        });

        if (scans.length === 0) {
            console.log('No scans found.');
        } else {
            scans.forEach(scan => {
                console.log(`\nScan ID: ${scan.id}`);
                console.log(`PR: #${scan.pr_number} - ${scan.pr_title}`);
                console.log(`Risk Level: ${scan.risk_level}`);
                console.log(`Blocked: ${scan.blocked}`);
                console.log(`Patterns: ${JSON.stringify(scan.matched_patterns)}`);
                console.log(`Time: ${scan.scanned_at}`);
            });
        }
    } catch (error) {
        console.error('Error fetching scans:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestScan();
