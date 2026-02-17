import { createServerClient } from '@/lib/supabase-server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // GDPR Data Portability: Collect all data linked to the user
        // We fetch relations to ensure a comprehensive export
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                subscription: true,
                repo_scans: {
                    include: {
                        llm_analysis: true,
                        risk_assessment: true,
                        final_risk_assessment: true,
                    },
                    orderBy: { scanned_at: 'desc' }
                },
                compliance_reports: {
                    orderBy: { generated_at: 'desc' }
                },
                ai_systems: {
                    include: {
                        audit_logs: true,
                    },
                    orderBy: { updated_at: 'desc' }
                },
                audit_logs: {
                    orderBy: { created_at: 'desc' },
                    take: 100 // Limit to last 100 actions to avoid massive file size
                }
            }
        });

        if (!userData) {
            return NextResponse.json({ error: 'User data not found' }, { status: 404 });
        }

        // --- SANITIZATION & TRANSFORMATION ---
        // We construct a clean object to avoid exposing internal IDs/metadata

        // Cast to any to avoid complex Prisma type inference issues with deep includes
        const userAny = userData as any;

        const subscription = userAny.subscription;
        const repo_scans = userAny.repo_scans || [];
        const ai_systems = userAny.ai_systems || [];
        const audit_logs = userAny.audit_logs || [];

        // --- SANITIZATION & TRANSFORMATION ---
        // We construct a clean object to avoid exposing internal IDs/metadata

        const exportData = {
            meta: {
                platform: "LexOculus",
                export_date: new Date().toISOString(),
                compliance_standard: "EU GDPR Article 20 - Right to Data Portability",
                user_note: "This file contains your personal data stored on LexOculus."
            },
            profile: {
                full_name: userData.full_name,
                email: userData.email,
                joined_at: userData.created_at,
            },
            subscription: subscription ? {
                tier: subscription.tier,
                status: subscription.status,
                current_period_end: subscription.current_period_end,
                limits: {
                    scans_limit: subscription.scans_limit,
                    repos_limit: subscription.repos_limit
                },
                usage: {
                    scans_used: subscription.scans_used,
                    repos_used: subscription.repos_used
                }
            } : null,
            ai_systems: ai_systems.map((system: any) => ({
                name: system.name,
                description: system.description,
                status: system.status,
                risk_level: system.risk_classification || 'NOT_ASSESSED',
                risk_score: system.risk_score,
                last_updated: system.updated_at,
                source_repo: system.source_repo_url,
            })),
            scan_history: repo_scans.map((scan: any) => ({
                repository: `${scan.repo_owner}/${scan.repo_name}`,
                scanned_at: scan.scanned_at,
                primary_language: scan.primary_language,
                total_files: scan.total_files,
                analysis_result: {
                    is_ai_system: scan.llm_analysis?.is_ai_system || false,
                    detected_types: scan.llm_analysis?.detected_model_types || [],
                    capabilities: scan.llm_analysis?.capabilities || []
                },
                risk_assessment: scan.risk_assessment ? {
                    level: scan.risk_assessment.risk_classification,
                    score: scan.risk_assessment.risk_score,
                    narrative: scan.risk_assessment.risk_narrative
                } : null
            })),
            activity_log: audit_logs.map((log: any) => ({
                action: log.action,
                details: log.details,
                timestamp: log.created_at
            }))
        };

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="lexoculus-data-${new Date().toISOString().split('T')[0]}.json"`,
            },
        });

    } catch (error) {
        console.error('Data export error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
