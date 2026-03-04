import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import { decrypt } from '@/lib/security/encryption';
import { getUserRepos, isTokenExpired } from '@/lib/github/github';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import prisma from '@/lib/infra/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get current authenticated user using server client
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Prevent caching at all costs
        const headers: Record<string, string> = {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        };

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Please log in to continue' },
                { status: 401, headers }
            );
        }

        // DEBUG: Add User ID to header
        headers['Debug-User-Id'] = user.id;

        // Check rate limit
        const rateLimit = await checkRateLimit(user.id, 'REPO_LIST');
        if (!rateLimit.allowed) {
            return rateLimitResponse(rateLimit.resetAt);
        }

        // Get GitHub connection
        const connection = await prisma.githubConnection.findFirst({
            where: { user_id: user.id },
            orderBy: { connected_at: 'desc' },
        });

        if (!connection) {
            return NextResponse.json(
                {
                    error: 'Not connected',
                    message: 'Please connect your GitHub account first'
                },
                { status: 400, headers }
            );
        }

        // Check token expiration
        if (isTokenExpired(connection.github_token_expires_at)) {
            return NextResponse.json(
                {
                    error: 'Token expired',
                    message: 'Your GitHub connection has expired. Please reconnect.',
                    needsReconnect: true,
                },
                { status: 401, headers }
            );
        }

        // Decrypt token
        const token = decrypt(connection.github_oauth_token);

        // Fetch repos from GitHub
        const repos = await getUserRepos(token);

        // Cache repos in database (upsert)
        const repoRecords = repos.map((repo) => ({
            user_id: user.id,
            github_repo_url: repo.full_name,
            repo_name: repo.name,
            repo_visibility: repo.private ? 'private' : 'public',
            last_synced_at: new Date(),
        }));

        // Delete old cached repos and insert new ones
        await prisma.$transaction([
            prisma.userGithubRepo.deleteMany({
                where: { user_id: user.id },
            }),
            prisma.userGithubRepo.createMany({
                data: repoRecords,
            }),
        ]);

        // Return formatted response
        return NextResponse.json({
            repos: repos.map((repo) => ({
                name: repo.name,
                full_name: repo.full_name,
                repo_url: repo.html_url,
                visibility: repo.private ? 'private' : 'public',
                description: repo.description,
                language: repo.language,
                stars: repo.stargazers_count,
                updated_at: repo.updated_at,
            })),
            github_username: connection.github_username,
            remaining_requests: rateLimit.remaining,
            userId: user.id // Proof of identity
        }, { headers });

    } catch (error) {
        console.error('Error fetching repos:', error);

        const errorHeaders: Record<string, string> = {
            'Cache-Control': 'no-store'
        };

        if (error instanceof Error) {
            if (error.message.includes('expired') || error.message.includes('invalid')) {
                return NextResponse.json(
                    {
                        error: 'Token invalid',
                        message: 'Please reconnect your GitHub account',
                        needsReconnect: true,
                    },
                    { status: 401, headers: errorHeaders }
                );
            }
            if (error.message.includes('rate limit')) {
                return NextResponse.json(
                    { error: 'Rate limited', message: 'GitHub API rate limit exceeded. Try again later.' },
                    { status: 429, headers: errorHeaders }
                );
            }
        }

        return NextResponse.json(
            { error: 'Server error', message: 'Failed to fetch repositories' },
            { status: 500, headers: errorHeaders }
        );
    }
}
