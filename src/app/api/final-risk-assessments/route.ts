import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * GET /api/final-risk-assessments
 * 
 * List all final risk assessments for the authenticated user
 */
export async function GET(request: NextRequest) {
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

        // 2. Parse query parameters
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');
        const approvedOnly = searchParams.get('approved_only') === 'true';

        // 3. Build query
        const whereClause: {
            user_id: string;
            approved_for_report?: boolean;
        } = {
            user_id: user.id,
        };

        if (approvedOnly) {
            whereClause.approved_for_report = true;
        }

        // 4. Fetch assessments
        const [assessments, total] = await Promise.all([
            prisma.finalRiskAssessment.findMany({
                where: whereClause,
                include: {
                    repo_scan: {
                        select: {
                            repo_name: true,
                            repo_owner: true,
                            primary_language: true,
                        },
                    },
                },
                orderBy: { verified_at: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.finalRiskAssessment.count({ where: whereClause }),
        ]);

        // 5. Return assessments
        return NextResponse.json({
            assessments: assessments.map(a => ({
                final_risk_assessment_id: a.id,
                repo_scan_id: a.repo_scan_id,
                repo_name: a.repo_scan.repo_name,
                repo_owner: a.repo_scan.repo_owner,
                primary_language: a.repo_scan.primary_language,
                final_risk_classification: a.final_risk_classification,
                final_risk_score: a.final_risk_score,
                context_verified: a.context_verified,
                approved_for_report: a.approved_for_report,
                requires_manual_review: a.requires_manual_review,
                verified_at: a.verified_at,
            })),
            total,
            limit,
            offset,
        });

    } catch (error) {
        console.error('List final risk assessments error:', error);
        return NextResponse.json(
            { error: 'Failed to list final risk assessments' },
            { status: 500 }
        );
    }
}
