import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { scanPublicRepository, parseGitHubUrl, validatePublicRepo } from '@/lib/github-public';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { checkUsageLimit, incrementUsage } from '@/lib/subscription';
import prisma from '@/lib/prisma';

interface ScanRequestBody {
    repo_url: string;
}

export async function POST(request: NextRequest) {
    try {
        // 1. Authentication Check
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Please log in to continue' },
                { status: 401 }
            );
        }

        // 2. Input Validation
        const body: ScanRequestBody = await request.json();
        const { repo_url } = body;

        const repoParams = parseGitHubUrl(repo_url);
        if (!repoParams) {
            return NextResponse.json(
                { error: 'Invalid URL', message: 'Please enter a valid GitHub repository URL' },
                { status: 400 }
            );
        }

        const { owner, repo } = repoParams;

        // 3. Subscription & Usage Limit Check (FEATURE GATING)
        // Free tier: 2 scans/month
        const usageCheck = await checkUsageLimit(user.id, 'scan');
        if (!usageCheck.allowed) {
            return NextResponse.json(
                {
                    error: 'Limit Reached',
                    message: usageCheck.reason,
                    upgrade: true
                },
                { status: 403 }
            );
        }

        // 4. Rate Limiting (API Protection)
        const rateLimit = checkRateLimit(user.id, 'REPO_SCAN');
        if (!rateLimit.allowed) {
            return rateLimitResponse(rateLimit.resetAt);
        }

        // 5. Validation: Is it actually public?
        const isPublic = await validatePublicRepo(owner, repo);
        if (!isPublic) {
            return NextResponse.json(
                {
                    error: 'Private Repository',
                    message: 'Free tier only supports public repositories. Please upgrade to scan private repos.',
                    upgrade: true
                },
                { status: 403 }
            );
        }

        // 6. Perform Scan (Public API - No Token)
        const scanData = await scanPublicRepository(owner, repo);

        // 7. Store Result
        const repoScan = await prisma.repoScan.create({
            data: {
                user_id: user.id,
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
            },
        });

        // 8. Increment Usage
        await incrementUsage(user.id, 'scan');

        // 9. Return Success
        return NextResponse.json({
            repo_scan_id: repoScan.id,
            repo_url: `https://github.com/${owner}/${repo}`,
            message: 'Repository scanned successfully',
            metadata: {
                name: scanData.repo_name,
                language: scanData.primary_language,
                total_files: scanData.total_files,
                license: scanData.license_type,
                stars: scanData.stars_count,
            },
            remaining: usageCheck.remaining - 1,
        });

    } catch (error) {
        console.error('Public scan error:', error);

        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return NextResponse.json(
                    { error: 'Not Found', message: 'Repository not found or is private' },
                    { status: 404 }
                );
            }
            if (error.message.includes('rate limit')) {
                return NextResponse.json(
                    { error: 'GitHub API Limit', message: 'Public API rate limit exceeded. Please try again in an hour.' },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Server Error', message: `Failed to scan repository: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
        );
    }
}
