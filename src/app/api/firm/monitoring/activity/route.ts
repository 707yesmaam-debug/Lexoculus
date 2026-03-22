import { createServerClient } from '@/lib/infra/supabase-server';
import { prisma } from '@/lib/infra/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const firmMember = await (prisma as any).firmMember.findUnique({
            where: { user_id: user.id }
        });

        if (!firmMember) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const clients = await (prisma as any).firmClient.findMany({
            where: { firm_id: firmMember.firm_id }
        });

        const clientRepoUrls = clients.map((c: any) => c.github_repo_url).filter(Boolean) as string[];
        const repoFullNames = clientRepoUrls.map(url => {
            const parts = url.split('/');
            return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
        });

        // PR scans for those repos
        const scans = await (prisma as any).pRScan.findMany({
            where: {
                repo_full_name: { in: repoFullNames }
            },
            take: 20,
            orderBy: { scanned_at: 'desc' }
        });

        return NextResponse.json({
            scans: scans.map((s: any) => ({
                ...s,
                client_name: clients.find((c: any) => c.github_repo_url?.includes(s.repo_full_name))?.client_name || 'Individual'
            }))
        });

    } catch (error) {
        console.error('Firm activity error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
