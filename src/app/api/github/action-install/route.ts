/**
 * GitHub Action Install API
 * 
 * Enable/disable ComplianceAI GitHub Action for repositories
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

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
            include: {
                _count: {
                    select: { pr_scans: true }
                }
            }
        });

        return NextResponse.json({
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
                pr_scan_count: i._count.pr_scans,
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

        // Verify user has access to this repo
        const repoScan = await prisma.repoScan.findFirst({
            where: {
                user_id: user.id,
                github_repo_url: { contains: repo_full_name },
            }
        });

        if (!repoScan) {
            return NextResponse.json(
                { error: 'Repository not found or not scanned yet. Please scan the repository first.' },
                { status: 404 }
            );
        }

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

        console.log(`✅ [INSTALL] GitHub Action enabled for ${repo_full_name}`);

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

        console.log(`🚫 [INSTALL] GitHub Action disabled for ${repo_full_name}`);

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
