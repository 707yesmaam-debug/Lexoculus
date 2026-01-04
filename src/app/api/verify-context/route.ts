import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { refineWithContext, ContextAnswers } from '@/lib/context-refiner';

// Rate limiting (5 verifications per hour)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetAt) {
        const resetAt = now + RATE_LIMIT_WINDOW;
        rateLimitMap.set(userId, { count: 1, resetAt });
        return { allowed: true, remaining: RATE_LIMIT - 1, resetAt };
    }

    if (userLimit.count >= RATE_LIMIT) {
        return { allowed: false, remaining: 0, resetAt: userLimit.resetAt };
    }

    userLimit.count++;
    return { allowed: true, remaining: RATE_LIMIT - userLimit.count, resetAt: userLimit.resetAt };
}

/**
 * POST /api/verify-context
 * 
 * Process user context answers and generate final risk assessment
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate user
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Parse request body
        const body = await request.json();
        const { risk_assessment_id, repo_scan_id, context_answers } = body;

        if (!risk_assessment_id || !repo_scan_id || !context_answers) {
            return NextResponse.json(
                { error: 'risk_assessment_id, repo_scan_id, and context_answers are required' },
                { status: 400 }
            );
        }

        // 3. Check rate limit
        const rateLimit = checkRateLimit(user.id);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded. Maximum 5 verifications per hour.',
                    resetAt: new Date(rateLimit.resetAt).toISOString(),
                },
                { status: 429 }
            );
        }

        // 4. Check for existing final assessment
        const existingFinal = await prisma.finalRiskAssessment.findUnique({
            where: { repo_scan_id },
        });

        if (existingFinal) {
            console.log(`📦 [CACHE] Returning cached final assessment for ${repo_scan_id}`);
            return NextResponse.json({
                cached: true,
                message: 'Final assessment already exists',
                final_risk_assessment_id: existingFinal.id,
                risk_assessment_id: existingFinal.risk_assessment_id,
                repo_scan_id: existingFinal.repo_scan_id,
                final_risk_classification: existingFinal.final_risk_classification,
                final_risk_score: existingFinal.final_risk_score,
                final_narrative: existingFinal.final_narrative,
                context_verified: existingFinal.context_verified,
                context_summary: existingFinal.context_summary,
                evidence_items: existingFinal.evidence_items,
                final_matched_articles: existingFinal.final_matched_articles,
                compliance_readiness: existingFinal.compliance_readiness,
                approved_for_report: existingFinal.approved_for_report,
                requires_manual_review: existingFinal.requires_manual_review,
                verified_at: existingFinal.verified_at,
            });
        }

        // 5. Fetch preliminary risk assessment
        const assessment = await prisma.riskAssessment.findUnique({
            where: { id: risk_assessment_id },
            include: {
                repo_scan: {
                    select: {
                        repo_name: true,
                        repo_owner: true,
                    },
                },
            },
        });

        if (!assessment) {
            return NextResponse.json(
                { error: 'Risk assessment not found. Please run Feature 3 first.' },
                { status: 404 }
            );
        }

        // 6. Verify ownership
        if (assessment.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized - you do not own this assessment' },
                { status: 401 }
            );
        }

        console.log(`🔍 [CONTEXT] Verifying context for ${assessment.repo_scan.repo_owner}/${assessment.repo_scan.repo_name}`);

        // 7. Run context refinement
        const result = refineWithContext(assessment, context_answers as ContextAnswers);

        console.log(`✅ [CONTEXT] Final classification: ${result.final_risk_classification} (score: ${result.final_risk_score})`);
        console.log(`   Evidence items: ${result.evidence_items.length}`);
        console.log(`   Approved for report: ${result.approved_for_report}`);

        // 8. Store final assessment in database
        const finalAssessment = await prisma.finalRiskAssessment.create({
            data: {
                risk_assessment_id,
                repo_scan_id,
                user_id: user.id,
                final_risk_classification: result.final_risk_classification,
                final_risk_score: result.final_risk_score,
                final_narrative: result.final_narrative,
                context_verified: result.context_verified,
                context_summary: result.context_summary as unknown as object,
                context_answers: context_answers as unknown as object,
                evidence_items: result.evidence_items as unknown as object[],
                final_matched_articles: result.final_matched_articles as unknown as object[],
                unresolved_risk_indicators: result.unresolved_risk_indicators as unknown as object[],
                escalation_reason: result.escalation_reason,
                compliance_readiness: result.compliance_readiness as unknown as object,
                approved_for_report: result.approved_for_report,
                requires_manual_review: result.requires_manual_review,
            },
        });

        // 9. Return final assessment
        return NextResponse.json({
            cached: false,
            final_risk_assessment_id: finalAssessment.id,
            risk_assessment_id: finalAssessment.risk_assessment_id,
            repo_scan_id: finalAssessment.repo_scan_id,
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
            verified_at: finalAssessment.verified_at,
            rate_limit_remaining: rateLimit.remaining,
        });

    } catch (error) {
        console.error('Context verification error:', error);
        return NextResponse.json(
            { error: 'Failed to verify context' },
            { status: 500 }
        );
    }
}
