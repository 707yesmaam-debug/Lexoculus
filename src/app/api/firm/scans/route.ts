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

        // Get the firm membership
        const firmMember = await (prisma as any).firmMember.findUnique({
            where: { user_id: user.id },
            include: { firm: true }
        });

        if (!firmMember) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get all clients for this firm
        const clients = await (prisma as any).firmClient.findMany({
            where: { firm_id: firmMember.firm_id }
        });

        const clientRepoUrls = clients.map((c: any) => c.github_repo_url).filter(Boolean) as string[];

        // Fetch AI systems belonging to these repos
        const aiSystems = await prisma.aiSystem.findMany({
            where: {
                source_repo_url: { in: clientRepoUrls },
                status: 'active'
            },
            include: {
                latest_scan: true
            },
            orderBy: { updated_at: 'desc' }
        });

        // Map client names to systems
        const systemsWithClientInfo = aiSystems.map(system => {
            const client = clients.find((c: any) => c.github_repo_url === system.source_repo_url);
            return {
                ...system,
                client_name: (client as any)?.client_name || 'Individual Scan'
            };
        });

        return NextResponse.json({
            ai_systems: systemsWithClientInfo,
            stats: {
                total: aiSystems.length,
                high_risk: aiSystems.filter(s => s.risk_classification === 'HIGH_RISK').length,
                limited_risk: aiSystems.filter(s => s.risk_classification === 'LIMITED_RISK').length,
                minimal_risk: aiSystems.filter(s => s.risk_classification === 'MINIMAL_RISK').length,
                unacceptable_risk: aiSystems.filter(s => s.risk_classification === 'UNACCEPTABLE').length,
                unclassified: aiSystems.filter(s => !s.risk_classification).length,
            }
        });

    } catch (error) {
        console.error('Firm scans list error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
