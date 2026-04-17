import { prisma } from '@/lib/infra/prisma';
import { NextResponse } from 'next/server';

// Protected by CRON_SECRET header — only callable by GitHub Actions / Vercel Cron
export async function GET(req: Request) {
    const secret = req.headers.get('x-cron-secret');
    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results: Record<string, number> = {};

    try {
        // 1. Delete expired RepoScans (cascade-deletes LlmCapabilityAnalysis, RiskAssessments)
        const scans = await prisma.repoScan.deleteMany({
            where: { expires_at: { lt: now } }
        });
        results.expired_scans = scans.count;

        // 2. Delete stale DemoRequests (90-day retention)
        const cutoff90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const demos = await prisma.demoRequest.deleteMany({
            where: { created_at: { lt: cutoff90 } }
        });
        results.demo_requests = demos.count;

        // 3. Delete stale EnterpriseInquiries (90-day retention)
        const inquiries = await prisma.enterpriseInquiry.deleteMany({
            where: { created_at: { lt: cutoff90 } }
        });
        results.enterprise_inquiries = inquiries.count;

        // 4. Delete AuditLogs older than 12 months (GDPR proportionality)
        const cutoff12m = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        const logs = await prisma.auditLog.deleteMany({
            where: { created_at: { lt: cutoff12m } }
        });
        results.audit_logs = logs.count;

        return NextResponse.json({ 
            success: true, 
            timestamp: now.toISOString(), 
            deleted: results 
        });
    } catch (error) {
        console.error('Cleanup cron error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
