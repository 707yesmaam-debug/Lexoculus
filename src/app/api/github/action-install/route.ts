/**
 * GitHub Action Install API
 * 
 * Enable/disable ComplianceAI GitHub Action for repositories
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { getUsageStatus } from '@/lib/subscription';
import { deriveRepoSecret } from '@/lib/github-security';

/**
 * GET /api/github/action-install
 * 
 * List all GitHub Action installations for current user
 */
export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const installations = await prisma.gitHubActionInstall.findMany({
            where: { user_id: user.id },
            orderBy: { installed_at: 'desc' },
        });

        // Get PR scan counts separately since there's no direct relation
        const repoNames = installations.map(i => i.repo_full_name);
        const prCounts = await prisma.pRScan.groupBy({
            by: ['repo_full_name'],
            where: {
                user_id: user.id,
                repo_full_name: { in: repoNames }
            },
            _count: {
                _all: true
            }
        });

        // Create a map for O(1) lookup
        const countMap = new Map(prCounts.map(c => [c.repo_full_name, c._count._all]));

        // Check subscription tier
        const usageStatus = await getUsageStatus(user.id);

        return NextResponse.json({
            can_enable_integrations: usageStatus.is_pro,
            installations: installations.map(i => ({
                id: i.id,
                repo_full_name: i.repo_full_name,
                status: i.status,
                block_on_high_risk: i.block_on_high_risk,
                block_on_unacceptable: i.block_on_unacceptable,
                notify_slack: i.notify_slack,
                installed_at: i.installed_at,
                last_scan_at: i.last_scan_at,
                total_scans: i.total_scans,
                pr_scan_count: countMap.get(i.repo_full_name) || 0,
            })),
            count: installations.length,
        });

    } catch (error) {
        console.error('List action installs error:', error);
        return NextResponse.json(
            { error: 'Failed to list installations' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/github/action-install
 * 
 * Enable GitHub Action for a repository
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check Pro subscription requirement
        const usageStatus = await getUsageStatus(user.id);
        if (!usageStatus.is_pro) {
            return NextResponse.json(
                { error: 'GitHub Actions integration is a Pro feature. Please upgrade.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            repo_full_name,
            block_on_high_risk = false,
            block_on_unacceptable = true,
            notify_slack = false,
            slack_webhook_url = null,
        } = body;

        if (!repo_full_name) {
            return NextResponse.json(
                { error: 'repo_full_name is required' },
                { status: 400 }
            );
        }

        // We trust the repo_full_name comes from the UI which fetches from GitHub.
        // In a strict environment, we would verify ownership via GitHub API here again,
        // but for now we proceed to allow installation on any repo the user claims (scoped to their ID).

        // Removed strict dependency on existing Scan history to allow fresh repos.

        // Create or update installation
        const installation = await prisma.gitHubActionInstall.upsert({
            where: {
                user_id_repo_full_name: {
                    user_id: user.id,
                    repo_full_name,
                }
            },
            update: {
                status: 'active',
                block_on_high_risk,
                block_on_unacceptable,
                notify_slack,
                slack_webhook_url,
            },
            create: {
                user_id: user.id,
                repo_full_name,
                block_on_high_risk,
                block_on_unacceptable,
                notify_slack,
                slack_webhook_url,
            },
        });

        console.log(`[SUCCESS] [INSTALL] GitHub Action enabled for ${repo_full_name}`);

        return NextResponse.json({
            success: true,
            installation: {
                id: installation.id,
                repo_full_name: installation.repo_full_name,
                status: installation.status,
                setup_instructions: {
                    step1: 'Copy the GitHub Action workflow file to your repository',
                    step2: 'Create .github/workflows/complianceai.yml in your repo',
                    step3: 'Add COMPLIANCEAI_WEBHOOK_SECRET as a repository secret',
                    template_url: '/github-action-template.yml',
                    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`,
                    // SECURITY: Provide the correct derived secret for this repo
                    webhook_secret: deriveRepoSecret(repo_full_name),
                }
            },
        });

    } catch (error) {
        console.error('Enable action install error:', error);
        return NextResponse.json(
            { error: 'Failed to enable GitHub Action' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/github/action-install
 * 
 * Disable GitHub Action for a repository
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const repo_full_name = searchParams.get('repo_full_name');

        if (!repo_full_name) {
            return NextResponse.json(
                { error: 'repo_full_name is required' },
                { status: 400 }
            );
        }

        // Update status to disabled (keep records for audit)
        await prisma.gitHubActionInstall.update({
            where: {
                user_id_repo_full_name: {
                    user_id: user.id,
                    repo_full_name,
                }
            },
            data: {
                status: 'disabled',
            },
        });

        console.log(`[BLOCKED] [INSTALL] GitHub Action disabled for ${repo_full_name}`);

        return NextResponse.json({
            success: true,
            message: `GitHub Action disabled for ${repo_full_name}`,
        });

    } catch (error) {
        console.error('Disable action install error:', error);
        return NextResponse.json(
            { error: 'Failed to disable GitHub Action' },
            { status: 500 }
        );
    }
}
