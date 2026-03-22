import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/infra/prisma';
import { createServerClient } from '@/lib/infra/supabase-server';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
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

        // Get AI Systems for this client
        const aiSystemsCount = await prisma.aiSystem.count({
            where: { firm_client_id: id }
        });

        // Get Latest Scan for this client
        const latestScan = await prisma.repoScan.findFirst({
            where: { firm_client_id: id },
            orderBy: { scanned_at: 'desc' }
        });

        // Get Conformity Tasks summary (Mocked for now until we port the actual task logic)
        const totalTasks = 12;
        const completedTasks = 4;

        return NextResponse.json({
            clientName: client.client_name,
            repoUrl: client.github_repo_url,
            monitoringEnabled: client.monitoring_enabled,
            aiSystemsCount,
            latestScan,
            totalTasks,
            completedTasks
        });

    } catch (error) {
        console.error('Error fetching client stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
