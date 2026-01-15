import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * DEBUG ENDPOINT: Clean up test GitHub connections
 * 
 * POST /api/debug/cleanup-connections
 * 
 * SECURITY: Remove this endpoint after debugging!
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Only allow specific admin emails to run this
        const adminEmails = ['varadkhoriya17@gmail.com', 'sudo.jod@gmail.com'];
        if (!adminEmails.includes(user.email || '')) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Get all connections before cleanup
        const beforeConnections = await prisma.githubConnection.findMany({
            select: {
                id: true,
                user_id: true,
                github_username: true,
                user: { select: { email: true } }
            }
        });

        console.log('[CLEANUP] Before:', JSON.stringify(beforeConnections, null, 2));

        // Delete ALL GitHub connections (for testing)
        // In production, you'd want to keep specific ones
        const deleted = await prisma.githubConnection.deleteMany({});

        console.log(`[CLEANUP] Deleted ${deleted.count} connections`);

        // Also clear the cached repos
        const deletedRepos = await prisma.userGithubRepo.deleteMany({});
        console.log(`[CLEANUP] Deleted ${deletedRepos.count} cached repos`);

        return NextResponse.json({
            message: 'Cleanup complete',
            deletedConnections: deleted.count,
            deletedCachedRepos: deletedRepos.count,
            beforeState: beforeConnections.map(c => ({
                email: c.user?.email,
                github: c.github_username
            }))
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }
}
