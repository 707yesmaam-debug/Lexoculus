import { NextResponse } from 'next/server';
import { prisma } from '@/lib/infra/prisma';

import crypto from 'crypto';

export async function GET() {
    try {
        const secretHash = process.env.GITHUB_WEBHOOK_SECRET
            ? crypto.createHash('sha256').update(process.env.GITHUB_WEBHOOK_SECRET).digest('hex').substring(0, 8)
            : 'MISSING';

        const [scans, installs] = await Promise.all([
            prisma.pRScan.findMany({
                orderBy: { scanned_at: 'desc' },
                take: 3
            }),
            prisma.gitHubActionInstall.findMany({
                where: { status: 'active' },
                include: { user: { select: { email: true } } },
                take: 3
            })
        ]);

        return NextResponse.json({
            env_check: { secret_hash: secretHash },
            scans,
            installs: installs.map((i: any) => ({
                id: i.id,
                repo: i.repo_full_name,
                status: i.status,
                user: i.user?.email || 'unknown'
            }))
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
