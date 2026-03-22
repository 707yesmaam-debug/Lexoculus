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

        // 1. Ensure user is part of a firm
        const firmMember = await prisma.firmMember.findUnique({
            where: { user_id: user.id },
            include: { firm: true }
        });

        if (!firmMember) {
            return NextResponse.json({ error: 'User is not associated with a firm' }, { status: 403 });
        }

        // 2. Fetch all clients for this firm
        const clients = await prisma.firmClient.findMany({
            where: { firm_id: firmMember.firm_id },
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                client_name: true,
                status: true,
                github_repo_url: true,
                monitoring_enabled: true,
                last_monitored_at: true,
            }
        });

        // 3. Fetch subscription to get client_limit
        const subscription = await prisma.subscription.findUnique({
            where: { user_id: user.id },
            select: { client_limit: true, status: true }
        });

        return NextResponse.json({ 
            clients, 
            client_limit: subscription?.client_limit || 0
        });
    } catch (error) {
        console.error('Error fetching firm clients:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
