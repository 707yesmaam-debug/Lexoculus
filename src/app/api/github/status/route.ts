import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Prevent caching at all costs
        const headers = {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        };

        if (!user) {
            return NextResponse.json({ isConnected: false, user: null }, { status: 401, headers });
        }

        const connection = await prisma.githubConnection.findFirst({
            where: { user_id: user.id }
        });

        if (connection) {
            return NextResponse.json({
                isConnected: true,
                username: connection.github_username,
                connectedAt: connection.connected_at
            }, { headers });
        }

        return NextResponse.json({ isConnected: false }, { headers });

    } catch (error) {
        console.error('GitHub status check failed:', error);
        return NextResponse.json(
            { isConnected: false },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
