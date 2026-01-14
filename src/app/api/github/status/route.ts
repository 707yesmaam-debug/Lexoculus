import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ isConnected: false, user: null }, { status: 401 });
        }

        const connection = await prisma.githubConnection.findFirst({
            where: { user_id: user.id }
        });

        if (connection) {
            return NextResponse.json({
                isConnected: true,
                username: connection.github_username,
                connectedAt: connection.connected_at
            });
        }

        return NextResponse.json({ isConnected: false });

    } catch (error) {
        console.error('GitHub status check failed:', error);
        return NextResponse.json({ isConnected: false }, { status: 500 });
    }
}
