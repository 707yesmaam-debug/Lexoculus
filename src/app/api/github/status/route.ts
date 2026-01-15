import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Prevent caching at all costs
        const headers: Record<string, string> = {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        };

        if (!user) {
            console.log('[GitHub Status] No authenticated user found');
            return NextResponse.json({ isConnected: false, user: null }, { status: 401, headers });
        }

        // DEBUG: Log the authenticated user info
        console.log(`[GitHub Status] Authenticated user - ID: ${user.id}, Email: ${user.email}`);

        // DEBUG: Add User ID to header for identity verification
        headers['Debug-User-Id'] = user.id;
        headers['Debug-User-Email'] = user.email || 'unknown';

        // Query for GitHub connection with this specific user
        const connection = await prisma.githubConnection.findFirst({
            where: { user_id: user.id }
        });

        // DEBUG: Log the query result
        console.log(`[GitHub Status] Connection query for user_id=${user.id}:`,
            connection ? `Found - GitHub user: ${connection.github_username}` : 'Not found'
        );

        if (connection) {
            // DEBUG: Also log connection details
            console.log(`[GitHub Status] Connection ID: ${connection.id}, Connected at: ${connection.connected_at}`);

            return NextResponse.json({
                isConnected: true,
                username: connection.github_username,
                connectedAt: connection.connected_at,
                userId: user.id,
                userEmail: user.email, // Added for debugging
                connectionId: connection.id // Added for debugging
            }, { headers });
        }

        return NextResponse.json({
            isConnected: false,
            userId: user.id,
            userEmail: user.email
        }, { headers });

    } catch (error) {
        console.error('GitHub status check failed:', error);
        return NextResponse.json(
            { isConnected: false },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}

