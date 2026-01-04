import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * GET /api/risk-assessment/:id
 * 
 * Fetch cached risk assessment for a repo scan
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

        // 2. Fetch assessment
        const assessment = await prisma.riskAssessment.findUnique({
            where: { repo_scan_id },
            include: {
                repo_scan: {
                    select: {
                        repo_name: true,
                        repo_owner: true,
                        primary_language: true,
                    },
                },
            },
        });

        if (!assessment) {
            return NextResponse.json(
                { error: 'Risk assessment not found. Please run risk classification first.' },
                { status: 404 }
            );
        }

        // 3. Verify ownership
        if (assessment.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized - you do not own this assessment' },
                { status: 401 }
            );
        }

        // 4. Return assessment
        return NextResponse.json({
            assessment_id: assessment.id,
            repo_scan_id: assessment.repo_scan_id,
            repo_name: assessment.repo_scan.repo_name,
            repo_owner: assessment.repo_scan.repo_owner,
            primary_language: assessment.repo_scan.primary_language,
            risk_classification: assessment.risk_classification,
            risk_score: assessment.risk_score,
            risk_narrative: assessment.risk_narrative,
            matched_annex_iii_articles: assessment.matched_annex_iii_articles,
            unmatched_risk_indicators: assessment.unmatched_risk_indicators,
            key_findings: assessment.key_findings,
            preliminary_assessment: {
                is_unacceptable: assessment.is_unacceptable,
                is_high_risk: assessment.is_high_risk,
                is_limited_risk: assessment.is_limited_risk,
                is_minimal_risk: assessment.is_minimal_risk,
            },
            manual_review_needed: assessment.manual_review_needed,
            manual_review_reason: assessment.manual_review_reason,
            assessed_at: assessment.assessed_at,
            assessment_version: assessment.assessment_version,
        });

    } catch (error) {
        console.error('Fetch risk assessment error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch risk assessment' },
            { status: 500 }
        );
    }
}
