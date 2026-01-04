import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { decrypt } from '@/lib/encryption';
import { scanRepository, isTokenExpired } from '@/lib/github';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import prisma from '@/lib/prisma';

interface ScanRequestBody {
    repo_url: string;
}

export async function POST(request: NextRequest) {
    try {
        // Get current authenticated user using server client
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Please log in to continue' },
                { status: 401 }
            );
        }

        // Parse request body
        const body: ScanRequestBody = await request.json();
        const { repo_url } = body;

        // Validate repo_url format (owner/repo)
        if (!repo_url || !repo_url.match(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/)) {
            return NextResponse.json(
                { error: 'Invalid input', message: 'Invalid repository URL. Format: owner/repo' },
                { status: 400 }
            );
        }

        // Check rate limit
        const rateLimit = checkRateLimit(user.id, 'REPO_SCAN');
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
                { error: 'Not connected', message: 'Please connect your GitHub account first' },
                { status: 400 }
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
                { status: 401 }
            );
        }

        // Verify user has access to this repo
        const userRepo = await prisma.userGithubRepo.findFirst({
            where: {
                user_id: user.id,
                github_repo_url: repo_url,
            },
        });

        if (!userRepo) {
            return NextResponse.json(
                { error: 'Access denied', message: 'You do not have access to this repository' },
                { status: 403 }
            );
        }

        // Decrypt token
        const token = decrypt(connection.github_oauth_token);

        // Parse owner/repo
        const [owner, repo] = repo_url.split('/');

        // Scan the repository
        const scanData = await scanRepository(token, owner, repo);

        // Store in database
        const repoScan = await prisma.repoScan.create({
            data: {
                user_id: user.id,
                github_repo_url: repo_url,
                repo_owner: scanData.repo_owner,
                repo_name: scanData.repo_name,
                repo_description: scanData.repo_description,
                readme_content: scanData.readme_content,
                package_json_content: scanData.package_json_content ?? undefined,
                requirements_txt_content: scanData.requirements_txt_content,
                pyproject_toml_content: scanData.pyproject_toml_content ?? undefined,
                file_tree: scanData.file_tree,
                total_files: scanData.total_files,
                primary_language: scanData.primary_language,
                license_type: scanData.license_type,
                stars_count: scanData.stars_count,
                forks_count: scanData.forks_count,
                watchers_count: scanData.watchers_count,
            },
        });

        // Return success response - THIS IS THE OUTPUT FOR FEATURE 2
        return NextResponse.json({
            repo_scan_id: repoScan.id,
            repo_url: repo_url,
            message: 'Repository scanned successfully',
            metadata: {
                name: scanData.repo_name,
                language: scanData.primary_language,
                total_files: scanData.total_files,
                license: scanData.license_type,
                stars: scanData.stars_count,
            },
            remaining_scans: rateLimit.remaining,
        });

    } catch (error) {
        console.error('Error scanning repository:', error);

        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return NextResponse.json(
                    { error: 'Not found', message: 'Repository not found or you do not have access' },
                    { status: 404 }
                );
            }
            if (error.message.includes('expired') || error.message.includes('invalid')) {
                return NextResponse.json(
                    {
                        error: 'Token invalid',
                        message: 'Please reconnect your GitHub account',
                        needsReconnect: true,
                    },
                    { status: 401 }
                );
            }
            if (error.message.includes('rate limit')) {
                return NextResponse.json(
                    { error: 'Rate limited', message: 'GitHub API rate limit exceeded. Try again later.' },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Server error', message: 'Failed to scan repository' },
            { status: 500 }
        );
    }
}
