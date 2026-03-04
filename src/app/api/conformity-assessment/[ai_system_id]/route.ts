'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';
import {
    determineConformityPathway,
    calculateCompletionPercent,
    getCurrentStep,
    getStepById
} from '@/lib/compliance/eu-ai-act/conformity-assessment';
import { classifyGPAI } from '@/lib/compliance/eu-ai-act/gpai-classifier';

interface RouteContext {
    params: Promise<{ ai_system_id: string }>;
}

/**
 * GET /api/conformity-assessment/:ai_system_id
 * Get existing conformity assessment for an AI system, or determine the pathway
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { ai_system_id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check for existing assessment
        const existing = await prisma.conformityAssessment.findUnique({
            where: { ai_system_id },
        });

        if (existing && existing.user_id === user.id) {
            // Hydrate stored steps with fresh static data (like article_url)
            const hydratedSteps = (existing.steps_data as any[]).map(step => {
                const freshStep = getStepById(step.step_id);
                return {
                    ...step,
                    article_url: freshStep?.article_url, // Inject fresh URL
                    article_reference: freshStep?.article_reference || step.article_reference, // Optional: keep refs fresh too
                };
            });

            return NextResponse.json({
                assessment: existing,
                steps: hydratedSteps,
                current_step: getCurrentStep(hydratedSteps),
                completion_percent: existing.completion_percent,
            });
        }

        // No existing assessment — determine pathway from AI system data
        const aiSystem = await prisma.aiSystem.findUnique({
            where: { id: ai_system_id },
            include: {
                latest_scan: {
                    include: {
                        risk_assessment: true,
                        llm_analysis: true,
                    }
                }
            }
        });

        if (!aiSystem) {
            return NextResponse.json({ error: 'AI system not found' }, { status: 404 });
        }

        if (aiSystem.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get risk data
        const riskClassification = aiSystem.risk_classification || 'MINIMAL_RISK';
        const matchedArticles = (aiSystem.matched_articles as any[]) || [];

        // Check for GPAI deployer status from llm analysis
        let isGpaiDeployer = false;
        const llmAnalysis = aiSystem.latest_scan?.llm_analysis;
        if (llmAnalysis) {
            const gpaiResult = classifyGPAI(llmAnalysis as any);
            isGpaiDeployer = gpaiResult.is_gpai_deployer;
        }

        // Determine pathway
        const pathway = determineConformityPathway(
            riskClassification,
            matchedArticles,
            isGpaiDeployer,
        );

        return NextResponse.json({
            assessment: null,
            pathway,
            ai_system: {
                id: aiSystem.id,
                name: aiSystem.name,
                risk_classification: riskClassification,
            },
        });

    } catch (error) {
        console.error('Conformity assessment GET error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conformity assessment' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/conformity-assessment/:ai_system_id
 * Create or initialize a conformity assessment for an AI system
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { ai_system_id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify AI system ownership
        const aiSystem = await prisma.aiSystem.findUnique({
            where: { id: ai_system_id },
            include: {
                latest_scan: {
                    include: {
                        llm_analysis: true,
                    }
                }
            }
        });

        if (!aiSystem) {
            return NextResponse.json({ error: 'AI system not found' }, { status: 404 });
        }

        if (aiSystem.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Determine pathway
        const riskClassification = aiSystem.risk_classification || 'MINIMAL_RISK';
        const matchedArticles = (aiSystem.matched_articles as any[]) || [];

        let isGpaiDeployer = false;
        const llmAnalysis = aiSystem.latest_scan?.llm_analysis;
        if (llmAnalysis) {
            const gpaiResult = classifyGPAI(llmAnalysis as any);
            isGpaiDeployer = gpaiResult.is_gpai_deployer;
        }

        const pathway = determineConformityPathway(
            riskClassification,
            matchedArticles,
            isGpaiDeployer,
        );

        // Create or update assessment
        const assessment = await prisma.conformityAssessment.upsert({
            where: { ai_system_id },
            create: {
                ai_system_id,
                user_id: user.id,
                assessment_module: pathway.applicable_module,
                module_name: pathway.module_name,
                legal_basis: pathway.legal_basis,
                total_steps: pathway.total_steps,
                steps_data: pathway.steps as any,
                requires_notified_body: pathway.requires_notified_body,
                self_assessment_eligible: pathway.self_assessment_eligible,
                estimated_timeline: pathway.estimated_timeline,
                risk_classification: riskClassification,
                annex_iii_category: pathway.annex_iii_category,
                notes: pathway.notes as any,
                status: 'not_started',
                completion_percent: 0,
            },
            update: {
                assessment_module: pathway.applicable_module,
                module_name: pathway.module_name,
                legal_basis: pathway.legal_basis,
                total_steps: pathway.total_steps,
                steps_data: pathway.steps as any,
                requires_notified_body: pathway.requires_notified_body,
                self_assessment_eligible: pathway.self_assessment_eligible,
                estimated_timeline: pathway.estimated_timeline,
                risk_classification: riskClassification,
                annex_iii_category: pathway.annex_iii_category,
                notes: pathway.notes as any,
            },
        });

        console.log(`[SUCCESS] [CONFORMITY] Created assessment for AI system ${aiSystem.name}: ${pathway.applicable_module}`);

        return NextResponse.json({
            assessment,
            pathway,
            message: 'Conformity assessment initialized',
        });

    } catch (error) {
        console.error('Conformity assessment POST error:', error);
        return NextResponse.json(
            { error: 'Failed to create conformity assessment' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/conformity-assessment/:ai_system_id
 * Update step status in the conformity assessment
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { ai_system_id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { step_id, status: stepStatus } = body;

        if (!step_id || !stepStatus) {
            return NextResponse.json(
                { error: 'step_id and status are required' },
                { status: 400 }
            );
        }

        // Verify ownership
        const existing = await prisma.conformityAssessment.findUnique({
            where: { ai_system_id },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
        }

        if (existing.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update the step status in steps_data
        const steps = (existing.steps_data as any[]).map(step => {
            if (step.step_id === step_id) {
                return { ...step, status: stepStatus };
            }
            return step;
        });

        const completionPercent = calculateCompletionPercent(steps);
        const currentStep = getCurrentStep(steps);
        const completedCount = steps.filter(s => s.status === 'completed').length;

        // Determine overall status
        let overallStatus = 'in_progress';
        if (completionPercent === 100) {
            overallStatus = 'completed';
        } else if (completedCount === 0 && steps.every(s => s.status === 'not_started')) {
            overallStatus = 'not_started';
        }

        const updated = await prisma.conformityAssessment.update({
            where: { ai_system_id },
            data: {
                steps_data: steps as any,
                completion_percent: completionPercent,
                current_step: currentStep ? currentStep.order : 0,
                status: overallStatus,
            },
        });

        console.log(`[SUCCESS] [CONFORMITY] Step ${step_id} → ${stepStatus} (${completionPercent}% complete)`);

        return NextResponse.json({
            assessment: updated,
            current_step: currentStep,
            completion_percent: completionPercent,
        });

    } catch (error) {
        console.error('Conformity assessment PATCH error:', error);
        return NextResponse.json(
            { error: 'Failed to update conformity assessment' },
            { status: 500 }
        );
    }
}
