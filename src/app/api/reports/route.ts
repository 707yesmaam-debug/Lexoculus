/**
 * GET /api/reports
 * 
 * Lists all compliance reports for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';

export async function GET(req: NextRequest) {
    try {
        // Authenticate user
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse query params
        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const offset = parseInt(searchParams.get('offset') || '0');

        // Fetch reports
        const [reports, total] = await Promise.all([
            prisma.complianceReport.findMany({
                where: { user_id: user.id },
                orderBy: { generated_at: 'desc' },
                take: limit,
                skip: offset,
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
            }),
            prisma.complianceReport.count({
                where: { user_id: user.id },
            }),
        ]);

        return NextResponse.json({
            reports: reports.map((report: any) => ({
                report_id: report.id,
                file_name: report.file_name,
                file_size: report.file_size,
                risk_classification: report.risk_classification,
                risk_score: report.risk_score,
                repo_name: report.final_risk_assessment?.risk_assessment?.repo_scan?.repo_name || 'Unknown',
                repo_owner: report.final_risk_assessment?.risk_assessment?.repo_scan?.repo_owner || 'Unknown',
                generated_at: report.generated_at,
                expires_at: report.expires_at,
                has_signature: !!report.digital_signature,
            })),
            total,
            limit,
            offset,
            has_more: offset + limit < total,
        });

    } catch (error) {
        console.error('[List Reports] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reports' },
            { status: 500 }
        );
    }
}
