import { NextRequest, NextResponse } from 'next/server';
import { scanPublicRepository, parseGitHubUrl, validatePublicRepo } from '@/lib/github-public';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

// System anonymous user ID — must exist in the users table
const ANONYMOUS_USER_ID = 'anonymous-system-user-0000';

/**
 * POST /api/anonymous-scan
 * 
 * Zero-signup public repo scan. No auth required.
 * Rate limited: 1 scan per IP per 24 hours.
 * 
 * Returns a scan_token that must be stored client-side
 * to access results and later claim ownership.
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Get client IP for rate limiting
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0]?.trim() ||
            request.headers.get('x-real-ip') ||
            'unknown';

        // 2. IP-based rate limit (1 scan per day)
        const rateLimit = await checkRateLimit(ip, 'ANONYMOUS_SCAN');
        if (!rateLimit.allowed) {
            return rateLimitResponse(rateLimit.resetAt);
        }

        // 3. Validate input
        const body = await request.json();
        const { repo_url } = body;

        if (!repo_url) {
            return NextResponse.json(
                { error: 'Missing repo_url', message: 'Please provide a GitHub repository URL' },
                { status: 400 }
            );
        }

        const repoParams = parseGitHubUrl(repo_url);
        if (!repoParams) {
            return NextResponse.json(
                { error: 'Invalid URL', message: 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)' },
                { status: 400 }
            );
        }

        const { owner, repo } = repoParams;

        // 4. Validate repo is public
        const isPublic = await validatePublicRepo(owner, repo);
        if (!isPublic) {
            return NextResponse.json(
                { error: 'Private Repository', message: 'Only public repositories can be scanned without an account.' },
                { status: 403 }
            );
        }

        // 5. Ensure anonymous system user exists
        await prisma.user.upsert({
            where: { id: ANONYMOUS_USER_ID },
            update: {},
            create: {
                id: ANONYMOUS_USER_ID,
                email: 'anonymous@system.lexoculus.com',
                full_name: 'Anonymous Scanner',
            },
        });

        // 6. Scan the repository
        const scanData = await scanPublicRepository(owner, repo);

        // 7. Generate scan token + set 7-day expiry
        const scanToken = randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // 8. Store result
        const repoScan = await prisma.repoScan.create({
            data: {
                user_id: ANONYMOUS_USER_ID,
                github_repo_url: `https://github.com/${owner}/${repo}`,
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
                scan_token: scanToken,
                expires_at: expiresAt,
            },
        });

        // 9. Opportunistic cleanup: delete expired anonymous scans
        try {
            const deleted = await prisma.repoScan.deleteMany({
                where: {
                    user_id: ANONYMOUS_USER_ID,
                    expires_at: { lt: new Date() },
                },
            });
            if (deleted.count > 0) {
                console.log(`🧹 [CLEANUP] Deleted ${deleted.count} expired anonymous scans`);
            }
        } catch (cleanupError) {
            // Non-fatal — log and continue
            console.error('⚠️ [CLEANUP] Failed to clean expired scans:', cleanupError);
        }

        // 10. Return success
        console.log(`✅ [ANON_SCAN] Public scan completed: ${owner}/${repo} (token: ${scanToken.slice(0, 8)}...)`);

        return NextResponse.json({
            repo_scan_id: repoScan.id,
            scan_token: scanToken,
            expires_at: expiresAt.toISOString(),
            message: 'Repository scanned successfully',
            metadata: {
                name: scanData.repo_name,
                owner: scanData.repo_owner,
                language: scanData.primary_language,
                total_files: scanData.total_files,
                license: scanData.license_type,
                stars: scanData.stars_count,
            },
        });

    } catch (error) {
        console.error('❌ [ANON_SCAN] Error:', error);

        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Repository not found or is private' },
                    { status: 404 }
                );
            }
            if (error.message.includes('rate limit')) {
                return NextResponse.json(
                    { error: 'GitHub API Limit', message: 'GitHub API rate limit exceeded. Please try again later.' },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Server Error', message: 'Failed to scan repository. Please try again.' },
            { status: 500 }
        );
    }
}
