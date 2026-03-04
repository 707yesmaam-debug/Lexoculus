import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';
import { generateTrustPackPDF } from '@/lib/output/pdf-generator';
import { getUsageStatus } from '@/lib/platform/subscription';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ repo_scan_id: string }> }
) {
    // 1. Authenticate
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse ID (Next.js 15+ async params)
    const { repo_scan_id } = await params;

    if (!repo_scan_id) {
        return NextResponse.json({ error: 'Missing repo_scan_id' }, { status: 400 });
    }

    // 3. Fetch Data
    const repoScan = await prisma.repoScan.findUnique({
        where: { id: repo_scan_id },
    });

    if (!repoScan) {
        return NextResponse.json({ error: 'Repo scan not found' }, { status: 404 });
    }

    if (repoScan.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 3.5 Check Subscription Feature Access
    const subscription = await getUsageStatus(user.id);
    if (!subscription.limits.features.pdf_reports) {
        return NextResponse.json({
            error: 'Upgrade Required',
            message: 'Enterprise Trust Packs are available on the Pro plan.',
            upgrade_required: true
        }, { status: 403 });
    }

    // Fetch latest analysis
    const analysis = await prisma.llmCapabilityAnalysis.findUnique({
        where: { repo_scan_id },
    });

    // 4. Determine Risk Classification (Fallback logic if no analysis)
    let riskClassification = 'MINIMAL_RISK';
    // Logic to determine risk from analysis or other sources
    if (analysis) {
        // You might store the final classification in the analysis or calculate it
        // For now, we'll try to infer or use a default
        // In a real scenario, you'd likely fetch the RiskAssessment result or similar
        // For MVP, if is_ai_system is true, assume at least Limited, etc.
        if (analysis.is_ai_system) riskClassification = 'LIMITED_RISK';
        // Real logic should come from stored risk assessment
    }

    // 5. Generate PDF
    try {
        const pdfBuffer = await generateTrustPackPDF({
            repoScan,
            analysis,
            riskClassification,
            generatedAt: new Date(),
        });

        // 6. Return Response
        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Vendor_Risk_Profile_${repoScan.repo_name}.pdf"`,
            },
        });
    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
