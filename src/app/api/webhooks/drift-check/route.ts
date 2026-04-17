import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/infra/prisma';

/**
 * POST /api/webhooks/drift-check
 * Triggered by GitHub Actions cron.
 * Iterates through all AI systems, checks GitHub for drift, and generates alerts.
 */
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.DRIFT_WEBHOOK_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized webhook trigger' }, { status: 401 });
    }

    try {
        console.log('[WEBHOOK] Starting automated drift check for all AI systems');
        
        const aiSystems = await prisma.aiSystem.findMany({
            where: {
                status: 'active',
                source_repo_url: { not: null },
            },
            include: {
                user: {
                    include: {
                        github_connections: true
                    }
                }
            }
        });

        const results = [];

        for (const aiSystem of aiSystems) {
            // Check if we have GitHub Connection
            const githubConnection = aiSystem.user.github_connections?.[0];
            if (!githubConnection || !aiSystem.source_repo_url) continue;

            try {
                const urlMatch = aiSystem.source_repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
                if (!urlMatch) continue;

                const [, owner, repo] = urlMatch;
                const repoName = repo.replace('.git', '');
                const token = githubConnection.github_oauth_token;

                // Fetch latest commits
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

                if (!response.ok) continue;

                const commits = await response.json();
                const latestCommitSha = commits[0]?.sha;

                if (!latestCommitSha) continue;

                const driftDetected = aiSystem.last_commit_sha !== null && aiSystem.last_commit_sha !== latestCommitSha;
                let filesChanged = 0;

                if (driftDetected && aiSystem.last_commit_sha) {
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
                    
                    // Generate an alert
                    await prisma.monitoringAlert.create({
                        data: {
                            user_id: aiSystem.user_id,
                            ai_system_id: aiSystem.id,
                            category: 'drift_detected',
                            severity: 'warning',
                            title: `Code Drift Detected: ${aiSystem.name}`,
                            message: `The source repository for ${aiSystem.name} has advanced by ${filesChanged} file changes since the last compliance scan. A new scan is recommended.`,
                            metadata: {
                                last_commit_sha: aiSystem.last_commit_sha,
                                latest_commit_sha: latestCommitSha,
                                files_changed: filesChanged
                            }
                        }
                    });
                }

                // Update AI System
                await prisma.aiSystem.update({
                    where: { id: aiSystem.id },
                    data: {
                        drift_detected: driftDetected,
                        files_changed_count: driftDetected ? filesChanged : 0,
                        drift_checked_at: new Date(),
                    }
                });

                results.push({ systemId: aiSystem.id, driftDetected, filesChanged });

            } catch (err) {
                console.error(`[WEBHOOK] Error checking system ${aiSystem.id}:`, err);
            }
        }

        console.log(`[WEBHOOK] Drift check completed. Checked ${results.length} valid active systems.`);
        return NextResponse.json({ success: true, checked: results.length, details: results });
        
    } catch (error) {
        console.error('[WEBHOOK] Global Drift Webhook Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
