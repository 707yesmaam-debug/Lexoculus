'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/ai-systems/:id/history
 * Get scan history for an AI System
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const aiSystem = await prisma.aiSystem.findUnique({
            where: { id },
            select: { user_id: true, name: true }
        });

        if (!aiSystem) {
            return NextResponse.json({ error: 'AI system not found' }, { status: 404 });
        }

        if (aiSystem.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch scan history ordered by date (newest first)
        const history = await prisma.aiSystemScan.findMany({
            where: { ai_system_id: id },
            include: {
                repo_scan: {
                    select: {
                        id: true,
                        repo_name: true,
                        repo_owner: true,
                        github_repo_url: true,
                        scanned_at: true,
                    }
                }
            },
            orderBy: { scanned_at: 'desc' }
        });

        return NextResponse.json({
            system_name: aiSystem.name,
            total_scans: history.length,
            history: history.map(h => ({
                id: h.id,
                repo_scan_id: h.repo_scan_id,
                risk_classification: h.risk_classification,
                risk_score: h.risk_score,
                previous_classification: h.previous_classification,
                classification_changed: h.classification_changed,
                scanned_at: h.scanned_at,
                repo_name: h.repo_scan.repo_name,
                repo_owner: h.repo_scan.repo_owner,
            }))
        });

    } catch (error) {
        console.error('History fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch history' },
            { status: 500 }
        );
    }
}
