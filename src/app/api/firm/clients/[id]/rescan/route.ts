import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import { decrypt } from '@/lib/security/encryption';
import { scanRepository } from '@/lib/github/github';
import { checkUsageLimit, incrementUsage } from '@/lib/platform/subscription';
import prisma from '@/lib/infra/prisma';
import { logAuditEvent, AUDIT_ACTIONS, ENTITY_TYPES } from '@/lib/security/audit-logger';

export const maxDuration = 300; // Allow 5 minutes for large repo cloning.

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clientId = (await params).id;

        // Verify the user is part of the firm that owns this client
        const firmMember = await prisma.firmMember.findUnique({
            where: { user_id: user.id },
            include: { firm: true }
        });

        if (!firmMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const client = await prisma.firmClient.findUnique({
            where: { id: clientId },
            include: { access: true }
        });

        if (!client || client.firm_id !== firmMember.firm_id) {
            return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 });
        }

        if (!client.access || !client.access.github_oauth_token) {
            return NextResponse.json({ error: 'Client has not authorized repository access yet.' }, { status: 400 });
        }

        // Feature Gating: Firm Pro limits check
        const usageCheck = await checkUsageLimit(user.id, 'scan');
        if (!usageCheck.allowed) {
            return NextResponse.json({ error: 'Limit exceeded', message: usageCheck.reason }, { status: 403 });
        }

        // Decrypt the delegated token
        const token = decrypt(client.access.github_oauth_token);
        
        // We expect client.github_repo_url to contain the authorized username or a specific repo
        // For delegated OAuth (repo scope), the token can scan any repo the user has access to,
        // but typically the client specifies a repo during onboarding or the firm configures it.
        // If github_repo_url is just the username, we might need a specific repo URL.
        // We'll require the frontend to pass the exact repo string if it hasn't been set.
        const body = await request.json().catch(() => ({}));
        let targetRepoUrl = body.repo_url || client.github_repo_url;

        if (!targetRepoUrl || !targetRepoUrl.includes('/')) {
            // It might just say "username (Authorized Account)"
            return NextResponse.json({ error: 'Missing specific repository URL (e.g. owner/repo) to scan.' }, { status: 400 });
        }
        
        // Cleanup if string has extra text
        if (targetRepoUrl.includes(' (Authorized Account)')) {
            return NextResponse.json({ error: 'Please provide a specific repository URL (owner/repo) to scan.' }, { status: 400 });
        }

        const [owner, repo] = targetRepoUrl.split('/');

        // Scan the repository using the CLIENT'S delegated token
        console.log(`[Firm Rescan] Initiating delegated scan for ${targetRepoUrl}`);
        console.log(`[DEBUG] Token starts with: ${token.substring(0, 7)}...`);
        console.log(`[DEBUG] Owner: ${owner}, Repo: ${repo}`);
        
        const scanData = await scanRepository(token, owner, repo);

        // Store in database under the firm user's account with strict firm/client tagging
        const repoScan = await prisma.repoScan.create({
            data: {
                user_id: user.id,
                firm_id: firmMember.firm_id,
                firm_client_id: client.id,
                github_repo_url: targetRepoUrl,
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

        // Auto-create or update AI System entry for this client
        const systemName = scanData.repo_name;
        const existingSystem = await prisma.aiSystem.findFirst({
            where: {
                firm_client_id: client.id,
                name: systemName
            }
        });

        let aiSystemId: string;
        let previousClassification: string | null = null;

        if (existingSystem) {
            aiSystemId = existingSystem.id;
            previousClassification = existingSystem.risk_classification;

            await prisma.aiSystem.update({
                where: { id: existingSystem.id },
                data: {
                    latest_scan_id: repoScan.id,
                    source_repo_url: `https://github.com/${targetRepoUrl}`,
                    last_scanned_at: new Date(),
                }
            });
            console.log(`[SUCCESS] [FIRM_AI_SYSTEM] Updated: ${systemName} for Client: ${client.client_name}`);
        } else {
            const newSystem = await prisma.aiSystem.create({
                data: {
                    user_id: user.id,
                    firm_id: firmMember.firm_id,
                    firm_client_id: client.id,
                    name: systemName,
                    description: scanData.repo_description || null,
                    source_repo_url: `https://github.com/${targetRepoUrl}`,
                    latest_scan_id: repoScan.id,
                    last_scanned_at: new Date(),
                }
            });
            aiSystemId = newSystem.id;
            console.log(`[SUCCESS] [FIRM_AI_SYSTEM] Created: ${systemName} for Client: ${client.client_name}`);
        }

        // Create scan history entry
        await prisma.aiSystemScan.create({
            data: {
                ai_system_id: aiSystemId,
                repo_scan_id: repoScan.id,
                previous_classification: previousClassification,
            }
        });

        // Log Audit Event for Accountability
        await logAuditEvent({
            userId: user.id,
            firmId: firmMember.firm_id,
            firmClientId: client.id,
            aiSystemId: aiSystemId,
            action: AUDIT_ACTIONS.SCAN_COMPLETED,
            entityType: ENTITY_TYPES.REPO_SCAN,
            entityId: repoScan.id,
            description: `Audit scan completed for ${client.client_name} - ${targetRepoUrl}`,
            metadata: {
                repo: targetRepoUrl,
                client: client.client_name,
                is_delegated: true
            }
        });

        // Update Client's last monitored date
        await prisma.firmClient.update({
            where: { id: client.id },
            data: { last_monitored_at: new Date() }
        });

        // Increment firm's usage counter
        await incrementUsage(user.id, 'scan');

        return NextResponse.json({
            repo_scan_id: repoScan.id,
            repo_url: targetRepoUrl,
            message: 'Client repository scanned successfully using delegated access',
            metadata: {
                name: scanData.repo_name,
                language: scanData.primary_language,
                total_files: scanData.total_files,
            }
        });

    } catch (error) {
        console.error('Error scanning client repository:', error);

        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return NextResponse.json({ error: 'Not found', message: 'Repository not found or client token lacks access' }, { status: 404 });
            }
            if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('Bad credentials')) {
                return NextResponse.json({ error: 'Token invalid', message: 'The client\'s delegated access has been revoked or expired.' }, { status: 401 });
            }
        }

        return NextResponse.json({ error: 'Server error', message: 'Failed to scan repository' }, { status: 500 });
    }
}
