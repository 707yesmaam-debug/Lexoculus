/**
 * GET /api/reports/[id]/download
 * 
 * Redirects to fresh signed URL for downloading the report PDF.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';
import { getReportDownloadUrl } from '@/lib/infra/storage';

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

        // Fetch report and verify ownership
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

        console.log(`[Download] User ${user.id} downloading report ${id}`);

        // Generate fresh signed URL (valid 1 hour)
        const downloadUrl = await getReportDownloadUrl(
            user.id,
            report.id,
            3600 // 1 hour
        );

        // Redirect to Supabase signed URL
        return NextResponse.redirect(downloadUrl);

    } catch (error) {
        console.error('[Download] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate download link' },
            { status: 500 }
        );
    }
}
