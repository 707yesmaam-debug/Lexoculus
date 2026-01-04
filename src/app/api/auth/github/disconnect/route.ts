import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * DELETE /api/auth/github/disconnect
 * 
 * Disconnects user's GitHub account and clears all cached data
 */
export async function DELETE(request: NextRequest) {
    try {
        // 1. Get authenticated user
        const supabase = await createServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Transaction to delete all GitHub-related data for this user
        // Option A: Maximum Privacy (Delete everything)
        await prisma.$transaction([
            // Delete connection info
            prisma.githubConnection.deleteMany({
                where: { user_id: user.id },
            }),
            // Delete cached repos
            prisma.userGithubRepo.deleteMany({
                where: { user_id: user.id },
            }),
            // Delete scan history
            prisma.repoScan.deleteMany({
                where: { user_id: user.id },
            }),
        ]);

        // 3. Return success
        return NextResponse.json({
            message: 'GitHub account disconnected successfully',
            redirect: '/dashboard/scanner',
        });

    } catch (error) {
        console.error('Disconnect error:', error);
        return NextResponse.json(
            { error: 'Failed to disconnect GitHub account' },
            { status: 500 }
        );
    }
}
