/**
 * GET /api/reports/[id] - Get report details
 * DELETE /api/reports/[id] - Delete a report
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { deleteReportFromSupabase, getReportDownloadUrl } from '@/lib/storage';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Authenticate user
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch report
        const report = await prisma.complianceReport.findUnique({
            where: {
                id,
                user_id: user.id,
            },
            include: {
                final_risk_assessment: {
                    include: {
                        risk_assessment: {
                            include: {
                                repo_scan: true,
                            },
                        },
                    },
                },
            },
        });

        if (!report) {
            return NextResponse.json(
                { error: 'Report not found or access denied' },
                { status: 404 }
            );
        }

        // Generate fresh download URL if expired
        let downloadUrl = report.file_url;
        if (report.expires_at && new Date(report.expires_at) < new Date()) {
            try {
                downloadUrl = await getReportDownloadUrl(user.id, report.id, 3600);

                // Update the URL in database
                await prisma.complianceReport.update({
                    where: { id: report.id },
                    data: {
                        file_url: downloadUrl,
                        expires_at: new Date(Date.now() + 3600 * 1000),
                    },
                });
            } catch (error) {
                console.error('[Get Report] Failed to refresh URL:', error);
            }
        }

        return NextResponse.json({
            report_id: report.id,
            file_name: report.file_name,
            file_url: downloadUrl,
            file_size: report.file_size,
            risk_classification: report.risk_classification,
            risk_score: report.risk_score,
            repo_name: (report as any).final_risk_assessment?.risk_assessment?.repo_scan?.repo_name || 'Unknown',
            repo_owner: (report as any).final_risk_assessment?.risk_assessment?.repo_scan?.repo_owner || 'Unknown',
            repo_url: (report as any).final_risk_assessment?.risk_assessment?.repo_scan?.repo_url || '',
            generated_at: report.generated_at,
            signed_at: report.signed_at,
            has_signature: !!report.digital_signature,
            version: report.version,
        });

    } catch (error) {
        console.error('[Get Report] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch report' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Authenticate user
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch report to verify ownership
        const report = await prisma.complianceReport.findUnique({
            where: {
                id,
                user_id: user.id,
            },
        });

        if (!report) {
            return NextResponse.json(
                { error: 'Report not found or access denied' },
                { status: 404 }
            );
        }

        console.log(`[Delete Report] User ${user.id} deleting report ${id}`);

        // Delete from Supabase Storage
        await deleteReportFromSupabase(user.id, report.id);

        // Delete from database
        await prisma.complianceReport.delete({
            where: { id: report.id },
        });

        console.log(`[Delete Report] Report deleted successfully`);

        return NextResponse.json({
            success: true,
            message: 'Report deleted',
        });

    } catch (error) {
        console.error('[Delete Report] Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete report' },
            { status: 500 }
        );
    }
}
