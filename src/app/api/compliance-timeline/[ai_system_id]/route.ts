'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { calculateComplianceTimeline, getAllDeadlines } from '@/lib/compliance-timeline';
import { classifyGPAI } from '@/lib/gpai-classifier';

interface RouteContext {
    params: Promise<{ ai_system_id: string }>;
}

/**
 * GET /api/compliance-timeline/:ai_system_id
 * Calculate compliance timeline for a specific AI system
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { ai_system_id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Special case: "all" returns unfiltered deadlines
        if (ai_system_id === 'all') {
            return NextResponse.json({
                timeline: {
                    total_deadlines: getAllDeadlines().length,
                    deadlines: getAllDeadlines(),
                },
            });
        }

        // Fetch AI system with risk data
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

        const riskClassification = aiSystem.risk_classification || 'MINIMAL_RISK';

        // Determine GPAI status from llm analysis
        let isGpaiDeployer = false;
        let isGpaiProvider = false;
        const llmAnalysis = aiSystem.latest_scan?.llm_analysis;
        if (llmAnalysis) {
            const gpaiResult = classifyGPAI(llmAnalysis as any);
            isGpaiDeployer = gpaiResult.is_gpai_deployer;
            isGpaiProvider = gpaiResult.is_gpai_provider;
        }

        // Calculate timeline
        const timeline = calculateComplianceTimeline(
            riskClassification,
            isGpaiDeployer,
            isGpaiProvider,
        );

        return NextResponse.json({
            timeline,
            ai_system: {
                id: aiSystem.id,
                name: aiSystem.name,
                risk_classification: riskClassification,
                is_gpai_deployer: isGpaiDeployer,
                is_gpai_provider: isGpaiProvider,
            },
        });

    } catch (error) {
        console.error('Compliance timeline error:', error);
        return NextResponse.json(
            { error: 'Failed to calculate timeline' },
            { status: 500 }
        );
    }
}
