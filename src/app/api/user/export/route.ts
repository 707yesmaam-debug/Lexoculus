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
                // Detailed data inclusion
                subscription: true,
                repo_scans: {
                    include: {
                        llm_analysis: true,
                        risk_assessment: true,
                        final_risk_assessment: true,
                    }
                },
                compliance_reports: true,
                ai_systems: {
                    include: {
                        documents: true,
                        evidence: true,
                        audit_logs: true,
                    }
                },
                audit_logs: true, // User's actions
                pr_scans: true,
                feedback: true,
                github_connections: {
                    select: {
                        id: true,
                        github_username: true,
                        connected_at: true,
                        // Exclude OAuth tokens!
                    }
                }
            }
        });

        if (!userData) {
            return NextResponse.json({ error: 'User data not found' }, { status: 404 });
        }

        const sanitizedData = {
            ...userData,
            repo_scans: userData.repo_scans.map(scan => ({
                ...scan,
                // SECURITY: Exclude raw file contents to prevent "internal code level data" leakage
                file_tree: undefined,
                readme_content: undefined,
                package_json_content: undefined,
                requirements_txt_content: undefined,
                pyproject_toml_content: undefined,
                // Keep the metadata about the scan
                total_files: scan.total_files,
                primary_language: scan.primary_language,
            }))
        };

        const exportData = {
            meta: {
                export_date: new Date().toISOString(),
                platform: "LexOculus",
                compliance_standard: "EU GDPR Article 20 - Right to Data Portability",
                user_id: user.id,
            },
            data: sanitizedData
        };

        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="lexoculus-data-${user.id}.json"`,
            },
        });

    } catch (error) {
        console.error('Data export error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
