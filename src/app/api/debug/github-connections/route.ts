import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * DEBUG ENDPOINT: List all GitHub connections in the database
 * This helps diagnose why connections are being shared between users
 * 
 * SECURITY: Remove this endpoint after debugging!
 */
export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get current user's email for context
        const currentUserEmail = user.email;
        const currentUserId = user.id;

        // DEBUG: Get ALL GitHub connections (only for debugging)
        const allConnections = await prisma.githubConnection.findMany({
            select: {
                id: true,
                user_id: true,
                github_username: true,
                connected_at: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                    }
                }
            },
            orderBy: { connected_at: 'desc' }
        });

        // Get all users for reference
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                created_at: true,
            },
            orderBy: { created_at: 'desc' }
        });

        // Log to server
        console.log('[DEBUG] All GitHub Connections:', JSON.stringify(allConnections, null, 2));
        console.log('[DEBUG] All Users:', JSON.stringify(allUsers, null, 2));
        console.log(`[DEBUG] Current user: ${currentUserId} (${currentUserEmail})`);

        // Find if current user has a connection
        const currentUserConnection = allConnections.find(c => c.user_id === currentUserId);

        return NextResponse.json({
            currentUser: {
                id: currentUserId,
                email: currentUserEmail,
                hasConnection: !!currentUserConnection,
                connection: currentUserConnection || null
            },
            allConnections: allConnections.map(c => ({
                connectionId: c.id,
                userId: c.user_id,
                userEmail: c.user?.email || 'NO_USER_RECORD',
                githubUsername: c.github_username,
                connectedAt: c.connected_at,
            })),
            allUsers: allUsers.map(u => ({
                id: u.id,
                email: u.email,
                createdAt: u.created_at,
            })),
            totalConnections: allConnections.length,
            totalUsers: allUsers.length,
        });

    } catch (error) {
        console.error('Debug endpoint error:', error);
        return NextResponse.json({ error: 'Failed to fetch debug info' }, { status: 500 });
    }
}
