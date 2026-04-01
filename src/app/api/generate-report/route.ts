/**
 * POST /api/generate-report
 * 
 * Generates a PDF compliance report, signs it, uploads to Supabase,
 * and creates database record.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';
import { generateComplianceReport } from '@/lib/output/pdf-generator';
import { signReport } from '@/lib/output/report-signer';
import { uploadReportToSupabase, checkStorageUsage } from '@/lib/infra/storage';
import { checkUsageLimit, incrementUsage } from '@/lib/platform/subscription';

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate user
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // FEATURE GATING: Check if user is allowed to generate reports (Pro+ only)
        // We use 'report' action which is gated in TIER_LIMITS
        const usageCheck = await checkUsageLimit(user.id, 'report');
        if (!usageCheck.allowed) {
            return NextResponse.json(
                {
                    error: 'Upgrade Required',
                    message: usageCheck.reason || 'PDF Report generation is a Pro feature.',
                    upgrade: true
                },
                { status: 403 }
            );
        }

        const { final_risk_assessment_id, repo_scan_id, regenerate } = await req.json();

        if (!final_risk_assessment_id || !repo_scan_id) {
            return NextResponse.json(
                { error: 'Missing final_risk_assessment_id or repo_scan_id' },
                { status: 400 }
            );
        }

        console.log(`[Generate Report] Starting for assessment: ${final_risk_assessment_id}`);

        // 2. Check for existing report (Verify ownership to prevent IDOR)
        const existingReport = await prisma.complianceReport.findFirst({
            where: { 
                final_risk_assessment_id,
                user_id: user.id
            },
        });

        if (existingReport && !regenerate) {
            return NextResponse.json({
                status: 'exists',
                report_id: existingReport.id,
                file_url: existingReport.file_url,
                file_size: existingReport.file_size,
                generated_at: existingReport.generated_at,
                message: 'Report already exists',
            });
        }

        // 2b. If regenerating, delete old database record
        if (existingReport && regenerate) {
            console.log(`[Generate Report] Deleting old report record: ${existingReport.id}`);
            await prisma.complianceReport.delete({
                where: { id: existingReport.id }
            });
        }

        // 3. Check storage quota
        const storageInfo = await checkStorageUsage();
        if (storageInfo.percentage > 90) {
            return NextResponse.json(
                {
                    error: 'Storage quota nearly full. Please delete old reports.',
                    storage_used: storageInfo.used,
                    storage_limit: storageInfo.limit,
                    percentage: storageInfo.percentage,
                },
                { status: 507 }
            );
        }

        // 4. Fetch assessment with all related data
        const assessment = await prisma.finalRiskAssessment.findUnique({
            where: {
                id: final_risk_assessment_id,
                user_id: user.id,
            },
            include: {
                risk_assessment: {
                    include: {
                        repo_scan: true,
                        llm_analysis: true,
                    },
                },
            },
        });

        if (!assessment) {
            return NextResponse.json(
                { error: 'Assessment not found or access denied' },
                { status: 404 }
            );
        }

        if (!assessment.approved_for_report) {
            return NextResponse.json(
                { error: 'Assessment not approved for report generation' },
                { status: 400 }
            );
        }

        // 4b. Fetch firm details if user is a firm member
        const firmMember = await prisma.firmMember.findUnique({
            where: { user_id: user.id },
            include: { firm: true }
        });

        // 5. Generate PDF
        console.log(`[Generate Report] Generating PDF...`);

        // Handle nullable llm_analysis
        const capabilities = assessment.risk_assessment.llm_analysis || {
            id: '',
            is_ai_system: false,
            confidence_score: 0,
            detected_capabilities: [],
            risk_indicators: [],
            llm_components: [],
        };

        const pdfBuffer = await generateComplianceReport({
            assessment: assessment as any,
            repo: assessment.risk_assessment.repo_scan as any,
            capabilities: capabilities as any,
            preliminary: assessment.risk_assessment as any,
            firm_branded: !!firmMember,
            firm_name: firmMember?.firm?.name,
            firm_custom_intro: firmMember?.firm?.custom_intro,
            firm_logo_url: firmMember?.firm?.logo_url,
        });

        console.log(`[Generate Report] PDF generated: ${pdfBuffer.length} bytes`);

        // 6. Sign PDF (SECURITY: Signing key is REQUIRED)
        console.log(`[Generate Report] Signing PDF...`);
        const signingKey = process.env.PDF_SIGNING_KEY;
        if (!signingKey) {
            console.error('[Generate Report] PDF_SIGNING_KEY not configured');
            return NextResponse.json(
                { error: 'Report signing not properly configured. Please contact support.' },
                { status: 500 }
            );
        }
        const { signedPdf, signature, timestamp } = await signReport(pdfBuffer, signingKey);

        // 7. Generate file name and ID
        const reportId = `rpt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `${assessment.risk_assessment.repo_scan.repo_name}_${assessment.final_risk_classification}_${dateStr}_v1.pdf`;

        // 8. Upload to Supabase Storage
        console.log(`[Generate Report] Uploading to Supabase...`);
        const { url, path, size } = await uploadReportToSupabase(
            signedPdf,
            user.id,
            reportId,
            fileName
        );

        console.log(`[Generate Report] Upload successful: ${path}`);

        // 9. Clean up any conflicting report with same filename (prevents unique constraint violation)
        await prisma.complianceReport.deleteMany({
            where: {
                user_id: user.id,
                file_name: fileName,
            },
        });

        // 10. Save to database
        const report = await prisma.complianceReport.create({
            data: {
                id: reportId,
                final_risk_assessment_id,
                user_id: user.id,
                file_name: fileName,
                file_path: path,
                file_url: url,
                file_size: size,
                risk_classification: assessment.final_risk_classification,
                risk_score: assessment.final_risk_score,
                digital_signature: signature,
                signed_at: timestamp,
                version: 1,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                firm_id: firmMember?.firm_id,
                firm_branded: !!firmMember,
                firm_name: firmMember?.firm?.name,
                firm_custom_intro: firmMember?.firm?.custom_intro,
                firm_logo_url: firmMember?.firm?.logo_url,
            },
        });

        console.log(`[Generate Report] Report saved: ${report.id}`);

        // Increment usage
        await incrementUsage(user.id, 'report');

        return NextResponse.json({
            status: 'complete',
            report_id: report.id,
            file_name: report.file_name,
            file_url: report.file_url,
            file_size: report.file_size,
            generated_at: report.generated_at,
            expires_at: report.expires_at,
        });

    } catch (error) {
        console.error('[Generate Report] Error:', error);
        console.error('[Generate Report] CRITICAL Error Details:', error);

        const errorResponse: { error: string; details?: string; stack?: string } = {
            error: 'Failed to generate report',
            details: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
