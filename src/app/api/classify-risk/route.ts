import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { classifyRiskFull } from '@/lib/risk-classifier';
import { generateTailoredQuestions } from '@/lib/groq';

import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

// ... (retain imports)

/**
 * POST /api/classify-risk
 * 
 * Trigger risk classification on an analyzed repository
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
        const { repo_scan_id, force, intended_purpose } = body;

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

        // 4. Check for existing assessment
        const existingAssessment = await prisma.riskAssessment.findUnique({
            where: { repo_scan_id },
        });

        if (existingAssessment && force) {
            // Force re-classify: delete existing assessment (cascades to FinalRiskAssessment + ComplianceReport)
            console.log(`[FORCE] Deleting existing assessment ${existingAssessment.id} for re-classification`);
            await prisma.riskAssessment.delete({ where: { id: existingAssessment.id } });
            console.log(`[FORCE] Cascade deleted assessment + downstream data`);
        } else if (existingAssessment) {
            console.log(`[CACHE] Returning cached risk assessment for ${repo_scan_id}`);
            return NextResponse.json({
                cached: true,
                message: 'Risk assessment already exists',
                assessment_id: existingAssessment.id,
                repo_scan_id: existingAssessment.repo_scan_id,
                risk_classification: existingAssessment.risk_classification,
                risk_score: existingAssessment.risk_score,
                risk_narrative: existingAssessment.risk_narrative,
                matched_annex_iii_articles: existingAssessment.matched_annex_iii_articles,
                unmatched_risk_indicators: existingAssessment.unmatched_risk_indicators,
                evidence: existingAssessment.evidence,
                key_findings: existingAssessment.key_findings,
                preliminary_assessment: {
                    is_unacceptable: existingAssessment.is_unacceptable,
                    is_high_risk: existingAssessment.is_high_risk,
                    is_limited_risk: existingAssessment.is_limited_risk,
                    is_minimal_risk: existingAssessment.is_minimal_risk,
                },
                manual_review_needed: existingAssessment.manual_review_needed,
                manual_review_reason: existingAssessment.manual_review_reason,
                assessed_at: existingAssessment.assessed_at,
            });
        }

        // 5. Fetch LLM capability analysis
        const llmAnalysis = await prisma.llmCapabilityAnalysis.findUnique({
            where: { repo_scan_id },
            include: {
                repo_scan: {
                    select: {
                        repo_name: true,
                        repo_owner: true,
                    },
                },
            },
        });

        if (!llmAnalysis) {
            return NextResponse.json(
                { error: 'LLM capability analysis not found. Please run Feature 2 first.' },
                { status: 404 }
            );
        }

        // 6. Verify ownership
        if (llmAnalysis.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized - you do not own this analysis' },
                { status: 401 }
            );
        }

        console.log(`[TARGET] [RISK] Classifying risk for ${llmAnalysis.repo_scan.repo_owner}/${llmAnalysis.repo_scan.repo_name}`);

        // 7. Run risk classification with Constraint Engine validation (purpose-aware)
        const result = classifyRiskFull(llmAnalysis, intended_purpose);

        console.log(`[SUCCESS] [RISK] Classification: ${result.risk_classification} (score: ${result.risk_score})`);
        console.log(`   Articles matched: ${result.matched_annex_iii_articles.length}`);
        console.log(`   Key findings: ${result.key_findings.length}`);
        if (result.constraint_validation?.was_overridden) {
            console.log(`   [LEGAL] Constraint Override: ${result.constraint_validation.override_reason}`);
        }

        // 8. Generate Tailored Questions (Feature 7)
        // 8. Generate Tailored Questions (Feature 7)
        console.log('[AI] [AI] Generating tailored verification questions...');

        let tailoredQuestions: { id: string; question: string; type: string }[] = [];
        try {
            // Cast Prisma JSON types to AnalysisResult interface
            const analysisForGroq = {
                ...llmAnalysis,
                capabilities: llmAnalysis.capabilities as string[],
                libraries: llmAnalysis.libraries as string[],
                ai_frameworks: llmAnalysis.ai_frameworks as string[],
                programming_languages: llmAnalysis.programming_languages as string[],
                detected_model_types: llmAnalysis.detected_model_types as string[],
                estimated_risk_indicators: llmAnalysis.estimated_risk_indicators as any,
                reasoning: llmAnalysis.analysis_notes || '',
            };

            tailoredQuestions = await generateTailoredQuestions(
                analysisForGroq,
                llmAnalysis.repo_scan.repo_name
            );
            console.log(`[SUCCESS] [AI] Generated ${tailoredQuestions.length} tailored questions`);
        } catch (groqError) {
            console.error('[WARN] [AI] Failed to generate tailored questions (continuing workflow):', groqError);
            tailoredQuestions = [];
        }

        // 9. Store assessment in database
        console.log('[DB] [DB] Saving assessment to database...');
        let assessment;
        try {
            assessment = await prisma.riskAssessment.create({
                data: {
                    repo_scan_id,
                    llm_analysis_id: llmAnalysis.id,
                    user_id: user.id,
                    risk_classification: result.risk_classification,
                    risk_score: result.risk_score,
                    risk_narrative: result.risk_narrative,
                    matched_annex_iii_articles: result.matched_annex_iii_articles as unknown as object[],
                    unmatched_risk_indicators: result.unmatched_risk_indicators as unknown as object[],
                    evidence: result.evidence as unknown as object[],
                    intended_purpose,
                    key_findings: result.key_findings as unknown as object[],
                    tailored_questions: tailoredQuestions as unknown as object[],
                    is_unacceptable: result.preliminary_assessment.is_unacceptable,
                    is_high_risk: result.preliminary_assessment.is_high_risk,
                    is_limited_risk: result.preliminary_assessment.is_limited_risk,
                    is_minimal_risk: result.preliminary_assessment.is_minimal_risk,
                    manual_review_needed: result.manual_review_needed,
                    manual_review_reason: result.manual_review_reason,
                },
            });
            console.log('[SUCCESS] [DB] Assessment saved successfully with ID:', assessment.id);
        } catch (dbError) {
            console.error('[ERROR] [DB] Failed to save with tailored_questions. Retrying without...', dbError);
            // Fallback: Try saving without tailored_questions (in case schema migration failed)
            assessment = await prisma.riskAssessment.create({
                data: {
                    repo_scan_id,
                    llm_analysis_id: llmAnalysis.id,
                    user_id: user.id,
                    risk_classification: result.risk_classification,
                    risk_score: result.risk_score,
                    risk_narrative: result.risk_narrative,
                    matched_annex_iii_articles: result.matched_annex_iii_articles as unknown as object[],
                    unmatched_risk_indicators: result.unmatched_risk_indicators as unknown as object[],
                    evidence: result.evidence as unknown as object[],
                    intended_purpose,
                    key_findings: result.key_findings as unknown as object[],
                    // tailored_questions OMITTED in fallback
                    is_unacceptable: result.preliminary_assessment.is_unacceptable,
                    is_high_risk: result.preliminary_assessment.is_high_risk,
                    is_limited_risk: result.preliminary_assessment.is_limited_risk,
                    is_minimal_risk: result.preliminary_assessment.is_minimal_risk,
                    manual_review_needed: result.manual_review_needed,
                    manual_review_reason: result.manual_review_reason,
                },
            });
            console.log('[SUCCESS] [DB] Fallback save successful with ID:', assessment.id);
        }

        // 10. Update AI System with risk classification
        try {
            const repoScan = await prisma.repoScan.findUnique({
                where: { id: repo_scan_id },
                select: { repo_name: true }
            });

            if (repoScan) {
                // Find and update the AI System
                const aiSystem = await prisma.aiSystem.findFirst({
                    where: {
                        user_id: user.id,
                        name: repoScan.repo_name
                    }
                });

                if (aiSystem) {
                    const previousClassification = aiSystem.risk_classification;
                    const previousScore = aiSystem.risk_score;
                    const classificationChanged = previousClassification != null && previousClassification !== assessment.risk_classification;

                    await prisma.aiSystem.update({
                        where: { id: aiSystem.id },
                        data: {
                            risk_classification: assessment.risk_classification,
                            risk_score: assessment.risk_score,
                            capabilities: llmAnalysis.capabilities || undefined,
                            matched_articles: assessment.matched_annex_iii_articles || undefined,
                        }
                    });

                    // Update scan history with classification
                    await prisma.aiSystemScan.updateMany({
                        where: {
                            ai_system_id: aiSystem.id,
                            repo_scan_id: repo_scan_id
                        },
                        data: {
                            risk_classification: assessment.risk_classification,
                            risk_score: assessment.risk_score,
                            previous_classification: previousClassification,
                            classification_changed: classificationChanged,
                        }
                    });

                    // Store comparison data for the API response
                    (assessment as any)._previousClassification = previousClassification;
                    (assessment as any)._previousScore = previousScore;
                    (assessment as any)._classificationChanged = classificationChanged;

                    console.log(`[SUCCESS] [AI_SYSTEM] Updated risk classification for ${repoScan.repo_name}`);
                    if (classificationChanged) {
                        console.log(`[HISTORY] Risk changed: ${previousClassification} → ${assessment.risk_classification}`);
                    }
                }
            }
        } catch (aiSystemError) {
            console.error('[WARN] [AI_SYSTEM] Failed to update AI System (non-fatal):', aiSystemError);
        }

        console.log('[START] [API] Returning successful response');
        // 9. Return assessment with constraint validation data
        return NextResponse.json({
            cached: false,
            reclassified: !!force,
            assessment_id: assessment.id,
            repo_scan_id: assessment.repo_scan_id,
            risk_classification: assessment.risk_classification,
            risk_score: assessment.risk_score,
            risk_narrative: assessment.risk_narrative,
            matched_annex_iii_articles: assessment.matched_annex_iii_articles,
            unmatched_risk_indicators: assessment.unmatched_risk_indicators,
            evidence: assessment.evidence,
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
            rate_limit_remaining: rateLimit.remaining,
            // Constraint Engine validation data
            constraint_validation: result.constraint_validation,
            // GPAI Classification (Chapter V, Articles 51-55)
            gpai_classification: result.gpai_classification,
            // Comparison data for re-scans
            previous_classification: (assessment as any)._previousClassification || null,
            previous_score: (assessment as any)._previousScore || null,
            classification_changed: (assessment as any)._classificationChanged || false,
        });

    } catch (error) {
        console.error('[ERROR] [API] Critical Risk classification error:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        // SECURITY: Only expose error details in development
        const errorResponse: { error: string; details?: string } = {
            error: 'Failed to classify risk',
        };
        if (process.env.NODE_ENV === 'development') {
            errorResponse.details = error instanceof Error ? error.message : String(error);
        }
        return NextResponse.json(errorResponse, { status: 500 });
    }
}
