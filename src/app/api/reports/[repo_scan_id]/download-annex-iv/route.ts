import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { generateAnnexIVTechnicalFile } from '@/lib/pdf-generator';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ repo_scan_id: string }> }
) {
    try {
        const { repo_scan_id } = await params;
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all necessary data
        const repoScan = await prisma.repoScan.findUnique({
            where: { id: repo_scan_id },
            include: {
                llm_analysis: true,
                final_risk_assessment: {
                    include: {
                        risk_assessment: true
                    }
                }
            }
        });

        if (!repoScan) {
            return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
        }

        if (repoScan.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!repoScan.final_risk_assessment) {
            return NextResponse.json({ error: 'Assessment not complete' }, { status: 400 });
        }

        // Prepare data for generator
        const reportData = {
            repo: repoScan,
            assessment: repoScan.final_risk_assessment,
            capabilities: repoScan.llm_analysis || {},
            preliminary: repoScan.final_risk_assessment.risk_assessment || {}
        };

        // Generate PDF
        const pdfBuffer = await generateAnnexIVTechnicalFile(reportData);

        // Return stream
        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Annex_IV_Technical_File_${repoScan.repo_name}.pdf"`,
            },
        });

    } catch (error) {
        console.error('Annex IV Generation Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate Technical File' },
            { status: 500 }
        );
    }
}
