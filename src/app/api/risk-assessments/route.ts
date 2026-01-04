import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * GET /api/risk-assessments
 * 
 * List all risk assessments for the authenticated user
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
        const riskLevel = searchParams.get('risk_level');

        // 3. Build query
        const whereClause: {
            user_id: string;
            risk_classification?: string;
        } = {
            user_id: user.id,
        };

        if (riskLevel && ['UNACCEPTABLE', 'HIGH_RISK', 'LIMITED_RISK', 'MINIMAL_RISK'].includes(riskLevel)) {
            whereClause.risk_classification = riskLevel;
        }

        // 4. Fetch assessments
        const [assessments, total] = await Promise.all([
            prisma.riskAssessment.findMany({
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
                orderBy: { assessed_at: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.riskAssessment.count({ where: whereClause }),
        ]);

        // 5. Return assessments
        return NextResponse.json({
            assessments: assessments.map(a => ({
                assessment_id: a.id,
                repo_scan_id: a.repo_scan_id,
                repo_name: a.repo_scan.repo_name,
                repo_owner: a.repo_scan.repo_owner,
                primary_language: a.repo_scan.primary_language,
                risk_classification: a.risk_classification,
                risk_score: a.risk_score,
                manual_review_needed: a.manual_review_needed,
                assessed_at: a.assessed_at,
            })),
            total,
            limit,
            offset,
        });

    } catch (error) {
        console.error('List risk assessments error:', error);
        return NextResponse.json(
            { error: 'Failed to list risk assessments' },
            { status: 500 }
        );
    }
}
