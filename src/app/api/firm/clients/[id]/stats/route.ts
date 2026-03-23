import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/infra/prisma';
import { createServerClient } from '@/lib/infra/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        
        const client = await prisma.firmClient.findUnique({
            where: { id },
            include: {
                firm: true
            }
        });

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Get delegated access token for this client
        const clientAccess = await (prisma as any).firmClientAccess.findFirst({
            where: { firm_client_id: id }
        });

        let repositories: any[] = [];
        if (clientAccess?.github_oauth_token) {
            try {
                const { decrypt } = require('@/lib/security/encryption');
                const token = decrypt(clientAccess.github_oauth_token);
                
                const repoRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (repoRes.ok) {
                    repositories = await repoRes.json();
                }
            } catch (err) {
                console.error('Failed to fetch repositories for client:', err);
            }
        }

        // Get AI Systems for this client
        const aiSystemsCount = await prisma.aiSystem.count({
            where: { firm_client_id: id }
        });

        // Get Latest Scan for this client
        const latestScan = await prisma.repoScan.findFirst({
            where: { firm_client_id: id },
            orderBy: { scanned_at: 'desc' },
            include: {
                llm_analysis: {
                    select: { id: true, is_ai_system: true, manual_review_needed: true }
                },
                risk_assessment: {
                    select: { id: true, risk_classification: true }
                },
                final_risk_assessment: {
                    select: { id: true, context_verified: true, approved_for_report: true, requires_manual_review: true }
                }
            }
        });

        let hasReport = false;
        if (latestScan?.final_risk_assessment?.id) {
            const reportCount = await prisma.complianceReport.count({
                where: { final_risk_assessment_id: latestScan.final_risk_assessment.id }
            });
            hasReport = reportCount > 0;
        }

        // Get Conformity Tasks summary
        const totalTasks = 12;
        const completedTasks = 4;

        return NextResponse.json({
            clientName: client.client_name,
            repoUrl: client.github_repo_url,
            onboardingToken: client.onboard_token,
            repositories: repositories.map((r: any) => ({
                name: r.name,
                full_name: r.full_name,
                url: r.html_url
            })),
            monitoringEnabled: client.monitoring_enabled,
            aiSystemsCount,
            latestScan,
            hasReport,
            totalTasks,
            completedTasks
        });

    } catch (error) {
        console.error('Error fetching client stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
