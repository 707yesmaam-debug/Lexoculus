import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * GET /api/capability-analysis/:id
 * 
 * Fetch cached analysis for a repo scan
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

        // 2. Fetch analysis
        const analysis = await prisma.llmCapabilityAnalysis.findUnique({
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

        if (!analysis) {
            return NextResponse.json(
                { error: 'Analysis not found. Repository has not been analyzed yet.' },
                { status: 404 }
            );
        }

        // 3. Verify ownership
        if (analysis.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized - you do not own this analysis' },
                { status: 401 }
            );
        }

        // 4. Return analysis
        return NextResponse.json({
            repo_scan_id: analysis.repo_scan_id,
            analysis_id: analysis.id,
            repo_name: analysis.repo_scan.repo_name,
            repo_owner: analysis.repo_scan.repo_owner,
            primary_language: analysis.repo_scan.primary_language,
            is_ai_system: analysis.is_ai_system,
            capabilities: analysis.capabilities,
            libraries: analysis.libraries,
            ai_frameworks: analysis.ai_frameworks,
            programming_languages: analysis.programming_languages,
            detected_model_types: analysis.detected_model_types,
            has_ml_pipeline: analysis.has_ml_pipeline,
            has_training_code: analysis.has_training_code,
            has_inference_code: analysis.has_inference_code,
            has_data_processing: analysis.has_data_processing,
            has_model_serialization: analysis.has_model_serialization,
            estimated_risk_indicators: analysis.estimated_risk_indicators,
            llm_model_used: analysis.llm_model_used,
            analysis_duration_ms: analysis.analysis_duration_ms,
            confidence_score: analysis.confidence_score,
            analysis_notes: analysis.analysis_notes,
            manual_review_needed: analysis.manual_review_needed,
            analyzed_at: analysis.analyzed_at,
            expires_at: analysis.expires_at,
        });

    } catch (error) {
        console.error('Fetch analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analysis' },
            { status: 500 }
        );
    }
}
