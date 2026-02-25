import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { analyzeRepository } from '@/lib/groq';

import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

// ... (retain imports)

/**
 * POST /api/analyze-capabilities
 * 
 * Trigger LLM analysis on a repo scan
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
        const { repo_scan_id } = body;

        if (!repo_scan_id) {
            return NextResponse.json(
                { error: 'repo_scan_id is required' },
                { status: 400 }
            );
        }

        // 3. Check rate limit
        const rateLimit = await checkRateLimit(user.id, 'LLM_ANALYSIS');
        if (!rateLimit.allowed) {
            return rateLimitResponse(rateLimit.resetAt);
        }

        // 4. Fetch repo scan
        const repoScan = await prisma.repoScan.findUnique({
            where: { id: repo_scan_id },
        });

        if (!repoScan) {
            return NextResponse.json(
                { error: 'Repo scan not found' },
                { status: 404 }
            );
        }

        // 5. Verify ownership
        if (repoScan.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized - you do not own this scan' },
                { status: 401 }
            );
        }

        // 6. Check for existing analysis
        const existingAnalysis = await prisma.llmCapabilityAnalysis.findUnique({
            where: { repo_scan_id },
        });

        if (existingAnalysis) {
            console.log(`[CACHE] [CACHE] Returning cached analysis for ${repo_scan_id}`);
            console.log(`   Analyzed at: ${existingAnalysis.analyzed_at}`);
            console.log(`   Model used: ${existingAnalysis.llm_model_used}`);

            return NextResponse.json({
                message: 'Analysis already exists (cached)',
                cached: true,
                analysis_id: existingAnalysis.id,
                is_ai_system: existingAnalysis.is_ai_system,
                capabilities: existingAnalysis.capabilities,
                libraries: existingAnalysis.libraries,
                ai_frameworks: existingAnalysis.ai_frameworks,
                programming_languages: existingAnalysis.programming_languages,
                detected_model_types: existingAnalysis.detected_model_types,
                has_ml_pipeline: existingAnalysis.has_ml_pipeline,
                has_training_code: existingAnalysis.has_training_code,
                has_inference_code: existingAnalysis.has_inference_code,
                has_data_processing: existingAnalysis.has_data_processing,
                has_model_serialization: existingAnalysis.has_model_serialization,
                estimated_risk_indicators: existingAnalysis.estimated_risk_indicators,
                llm_model_used: existingAnalysis.llm_model_used,
                analysis_duration_ms: existingAnalysis.analysis_duration_ms,
                confidence_score: existingAnalysis.confidence_score,
                analyzed_at: existingAnalysis.analyzed_at,
            });
        }

        // 7. Run LLM analysis
        let groqResponse;
        try {
            groqResponse = await analyzeRepository(repoScan);
        } catch (error) {
            console.error('LLM analysis error:', error);

            const errorMessage = error instanceof Error ? error.message : 'Analysis failed';

            if (errorMessage.includes('rate limit')) {
                return NextResponse.json(
                    { error: 'Groq API rate limit exceeded. Please wait and try again.' },
                    { status: 429 }
                );
            }

            if (errorMessage.includes('timeout')) {
                return NextResponse.json(
                    { error: 'Analysis timeout. Repository may be too large.' },
                    { status: 503 }
                );
            }

            if (errorMessage.includes('GROQ_API_KEY')) {
                return NextResponse.json(
                    { error: 'LLM service not configured. Please set GROQ_API_KEY.' },
                    { status: 503 }
                );
            }

            return NextResponse.json(
                { error: 'LLM analysis failed. Please try again.' },
                { status: 500 }
            );
        }

        // 8. Store analysis in database
        const analysis = await prisma.llmCapabilityAnalysis.create({
            data: {
                repo_scan_id,
                user_id: user.id,
                is_ai_system: groqResponse.analysis.is_ai_system,
                capabilities: groqResponse.analysis.capabilities,
                libraries: groqResponse.analysis.libraries,
                ai_frameworks: groqResponse.analysis.ai_frameworks,
                programming_languages: groqResponse.analysis.programming_languages,
                detected_model_types: groqResponse.analysis.detected_model_types,
                has_ml_pipeline: groqResponse.analysis.has_ml_pipeline,
                has_training_code: groqResponse.analysis.has_training_code,
                has_inference_code: groqResponse.analysis.has_inference_code,
                has_data_processing: groqResponse.analysis.has_data_processing,
                has_model_serialization: groqResponse.analysis.has_model_serialization,
                estimated_risk_indicators: groqResponse.analysis.estimated_risk_indicators,
                llm_model_used: groqResponse.model,
                analysis_duration_ms: groqResponse.duration_ms,
                confidence_score: groqResponse.confidence_score,
                analysis_notes: groqResponse.analysis.reasoning,
            },
        });

        // 9. Return analysis
        return NextResponse.json({
            repo_scan_id,
            analysis_id: analysis.id,
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
            analyzed_at: analysis.analyzed_at,
            rate_limit_remaining: rateLimit.remaining,
        });

    } catch (error) {
        console.error('Analyze capabilities error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze capabilities' },
            { status: 500 }
        );
    }
}
