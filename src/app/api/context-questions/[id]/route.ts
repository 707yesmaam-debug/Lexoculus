import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';
import { generateContextQuestions } from '@/lib/compliance/eu-ai-act/context-questions';

/**
 * GET /api/context-questions/:id
 * 
 * Get dynamic questionnaire based on preliminary risk assessment
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: risk_assessment_id } = await params;

        // 1. Authenticate user
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 2. Fetch risk assessment
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
                { error: 'Risk assessment not found.' },
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

        // 4. Generate dynamic questions
        const questionSets = generateContextQuestions(assessment);

        // 5. Return questions
        return NextResponse.json({
            risk_assessment_id: assessment.id,
            repo_scan_id: assessment.repo_scan_id,
            repo_name: assessment.repo_scan.repo_name,
            repo_owner: assessment.repo_scan.repo_owner,
            preliminary_classification: assessment.risk_classification,
            preliminary_score: assessment.risk_score,
            matched_articles: assessment.matched_annex_iii_articles,
            question_sets: questionSets,
        });

    } catch (error) {
        console.error('Get context questions error:', error);
        return NextResponse.json(
            { error: 'Failed to get context questions' },
            { status: 500 }
        );
    }
}
