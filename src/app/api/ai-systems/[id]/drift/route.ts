'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/ai-systems/:id/drift
 * Check for code drift since last scan
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get AI System with user's GitHub connection
        const aiSystem = await prisma.aiSystem.findUnique({
            where: { id },
            include: {
                user: {
                    include: {
                        github_connections: true
                    }
                }
            }
        });

        if (!aiSystem) {
            return NextResponse.json({ error: 'AI System not found' }, { status: 404 });
        }

        if (aiSystem.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if we have a source repo
        if (!aiSystem.source_repo_url) {
            return NextResponse.json({
                drift_detected: false,
                message: 'No source repository linked'
            });
        }

        // Extract owner/repo from URL
        const urlMatch = aiSystem.source_repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!urlMatch) {
            return NextResponse.json({
                drift_detected: false,
                message: 'Invalid repository URL'
            });
        }

        const [, owner, repo] = urlMatch;
        const repoName = repo.replace('.git', '');

        // Get GitHub token
        const githubConnection = aiSystem.user.github_connections?.[0];
        if (!githubConnection) {
            return NextResponse.json({
                drift_detected: false,
                message: 'No GitHub connection'
            });
        }

        // Decrypt token (simplified - use your actual decryption)
        const token = githubConnection.github_oauth_token;

        // Fetch latest commits from GitHub
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=1`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'LexOculus-ComplianceAI',
                },
            }
        );

        if (!response.ok) {
            console.error('GitHub API error:', await response.text());
            return NextResponse.json({
                drift_detected: false,
                message: 'Failed to check GitHub'
            });
        }

        const commits = await response.json();
        const latestCommitSha = commits[0]?.sha;

        if (!latestCommitSha) {
            return NextResponse.json({
                drift_detected: false,
                message: 'No commits found'
            });
        }

        // Compare with last scanned commit
        const driftDetected = aiSystem.last_commit_sha !== null &&
            aiSystem.last_commit_sha !== latestCommitSha;

        let filesChanged = 0;

        // If drift detected, count changed files
        if (driftDetected && aiSystem.last_commit_sha) {
            try {
                const compareResponse = await fetch(
                    `https://api.github.com/repos/${owner}/${repoName}/compare/${aiSystem.last_commit_sha}...${latestCommitSha}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'LexOculus-ComplianceAI',
                        },
                    }
                );

                if (compareResponse.ok) {
                    const compareData = await compareResponse.json();
                    filesChanged = compareData.files?.length || 0;
                }
            } catch (err) {
                console.error('Compare error:', err);
            }
        }

        // Update AI System with drift status
        await prisma.aiSystem.update({
            where: { id },
            data: {
                drift_detected: driftDetected,
                files_changed_count: filesChanged,
                drift_checked_at: new Date(),
            }
        });

        console.log(`[SCAN] [DRIFT] ${aiSystem.name}: ${driftDetected ? `${filesChanged} files changed` : 'No changes'}`);

        return NextResponse.json({
            drift_detected: driftDetected,
            files_changed: filesChanged,
            last_commit_sha: aiSystem.last_commit_sha,
            latest_commit_sha: latestCommitSha,
            last_scanned_at: aiSystem.last_scanned_at,
            drift_checked_at: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Drift check error:', error);
        return NextResponse.json(
            { error: 'Failed to check drift' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/ai-systems/:id/drift
 * Reset drift status (after rescan)
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { commit_sha } = await request.json();

        const aiSystem = await prisma.aiSystem.findUnique({
            where: { id },
            select: { user_id: true }
        });

        if (!aiSystem || aiSystem.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Reset drift after scan
        await prisma.aiSystem.update({
            where: { id },
            data: {
                last_commit_sha: commit_sha,
                drift_detected: false,
                files_changed_count: 0,
                drift_checked_at: new Date(),
            }
        });

        return NextResponse.json({
            message: 'Drift status reset',
            commit_sha
        });

    } catch (error) {
        console.error('Drift reset error:', error);
        return NextResponse.json(
            { error: 'Failed to reset drift' },
            { status: 500 }
        );
    }
}
