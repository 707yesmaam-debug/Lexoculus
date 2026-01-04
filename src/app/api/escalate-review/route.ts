import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * POST /api/escalate-review
 * 
 * Flag a final assessment for manual review
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
        const { final_risk_assessment_id, reason } = body;

        if (!final_risk_assessment_id) {
            return NextResponse.json(
                { error: 'final_risk_assessment_id is required' },
                { status: 400 }
            );
        }

        // 3. Fetch final assessment
        const finalAssessment = await prisma.finalRiskAssessment.findUnique({
            where: { id: final_risk_assessment_id },
        });

        if (!finalAssessment) {
            return NextResponse.json(
                { error: 'Final risk assessment not found' },
                { status: 404 }
            );
        }

        // 4. Verify ownership
        if (finalAssessment.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized - you do not own this assessment' },
                { status: 401 }
            );
        }

        // 5. Update assessment to require manual review
        const updated = await prisma.finalRiskAssessment.update({
            where: { id: final_risk_assessment_id },
            data: {
                requires_manual_review: true,
                approved_for_report: false,
                escalation_reason: reason || 'User requested manual review',
                manual_review_notes: `Escalated by user at ${new Date().toISOString()}`,
            },
        });

        console.log(`🚨 [ESCALATE] Assessment ${final_risk_assessment_id} flagged for manual review`);

        // 6. Return confirmation
        return NextResponse.json({
            escalation_id: `escalation_${Date.now()}`,
            final_risk_assessment_id: updated.id,
            status: 'pending_review',
            requires_manual_review: true,
            escalation_reason: updated.escalation_reason,
            escalated_at: new Date().toISOString(),
            estimated_review_time: '2-3 business days',
        });

    } catch (error) {
        console.error('Escalate review error:', error);
        return NextResponse.json(
            { error: 'Failed to escalate for review' },
            { status: 500 }
        );
    }
}
