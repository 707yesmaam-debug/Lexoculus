import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * GET /api/final-risk-assessment/:id
 * 
 * Fetch final risk assessment for a repo scan
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: repo_scan_id } = await params;

        // 1. Authenticate user
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Fetch final assessment
        const finalAssessment = await prisma.finalRiskAssessment.findUnique({
            where: { repo_scan_id },
            include: {
                repo_scan: {
                    select: {
                        repo_name: true,
                        repo_owner: true,
                        primary_language: true,
                        ai_system: {
                            select: { id: true }
                        },
                        scan_history: {
                            select: { ai_system_id: true },
                            take: 1
                        }
                    },
                },
                risk_assessment: {
                    select: {
                        risk_classification: true,
                        risk_score: true,
                        matched_annex_iii_articles: true,
                    },
                },
            },
        });

        if (!finalAssessment) {
            return NextResponse.json(
                { error: 'Final risk assessment not found. Please run context verification first.' },
                { status: 404 }
            );
        }

        // 3. Verify ownership
        if (finalAssessment.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized - you do not own this assessment' },
                { status: 401 }
            );
        }

        // Determine ai_system_id (either it's the latest scan for a system, or it's in the scan history)
        const ai_system_id = finalAssessment.repo_scan.ai_system?.id ||
            finalAssessment.repo_scan.scan_history?.[0]?.ai_system_id || null;

        // 4. Return final assessment
        return NextResponse.json({
            final_risk_assessment_id: finalAssessment.id,
            risk_assessment_id: finalAssessment.risk_assessment_id,
            repo_scan_id: finalAssessment.repo_scan_id,
            ai_system_id,
            repo_name: finalAssessment.repo_scan.repo_name,
            repo_owner: finalAssessment.repo_scan.repo_owner,
            primary_language: finalAssessment.repo_scan.primary_language,

            // Preliminary (from Feature 3)
            preliminary_classification: finalAssessment.risk_assessment.risk_classification,
            preliminary_score: finalAssessment.risk_assessment.risk_score,
            preliminary_articles: finalAssessment.risk_assessment.matched_annex_iii_articles,

            // Final (from Feature 4)
            final_risk_classification: finalAssessment.final_risk_classification,
            final_risk_score: finalAssessment.final_risk_score,
            final_narrative: finalAssessment.final_narrative,
            context_verified: finalAssessment.context_verified,
            context_summary: finalAssessment.context_summary,
            evidence_items: finalAssessment.evidence_items,
            final_matched_articles: finalAssessment.final_matched_articles,
            unresolved_risk_indicators: finalAssessment.unresolved_risk_indicators,
            compliance_readiness: finalAssessment.compliance_readiness,
            approved_for_report: finalAssessment.approved_for_report,
            requires_manual_review: finalAssessment.requires_manual_review,
            escalation_reason: finalAssessment.escalation_reason,
            verified_at: finalAssessment.verified_at,
            verification_version: finalAssessment.verification_version,
        });

    } catch (error) {
        console.error('Fetch final risk assessment error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch final risk assessment' },
            { status: 500 }
        );
    }
}
