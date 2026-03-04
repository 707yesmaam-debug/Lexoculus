'use server';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/infra/prisma';

interface RouteContext {
    params: Promise<{ shareId: string }>;
}

/**
 * GET /api/status/:shareId
 * Public endpoint - returns compliance status for shared AI system
 * No authentication required
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { shareId } = await context.params;

        // Find AI system by share ID
        const aiSystem = await prisma.aiSystem.findUnique({
            where: { public_share_id: shareId },
            include: {
                user: {
                    include: {
                        subscription: true
                    }
                },
                latest_scan: {
                    select: {
                        scanned_at: true,
                        repo_name: true,
                    }
                }
            }
        });

        if (!aiSystem) {
            return NextResponse.json(
                { error: 'Status page not found' },
                { status: 404 }
            );
        }

        // Check if sharing is enabled
        if (!aiSystem.share_enabled) {
            return NextResponse.json(
                { error: 'This status page has been disabled by the owner' },
                { status: 403 }
            );
        }

        // MRR GATING: Check if owner has active subscription
        const subscription = aiSystem.user?.subscription;
        const hasActiveSubscription = subscription?.status === 'active' ||
            subscription?.status === 'trialing';

        if (!hasActiveSubscription) {
            return NextResponse.json(
                {
                    error: 'subscription_inactive',
                    message: 'This compliance status page is temporarily unavailable. The system owner needs to maintain an active subscription.'
                },
                { status: 403 }
            );
        }

        // Return public status data (no sensitive info)
        return NextResponse.json({
            system_name: aiSystem.name,
            description: aiSystem.description,
            risk_classification: aiSystem.risk_classification,
            risk_score: aiSystem.risk_score,
            lifecycle_stage: aiSystem.lifecycle_stage,
            last_scanned_at: aiSystem.last_scanned_at,
            compliance_status: aiSystem.risk_classification ? 'assessed' : 'pending',
            verified_by: 'LexOculus',
            // Don't expose: user info, source_repo_url, capabilities, matched_articles
        });

    } catch (error) {
        console.error('Public status error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch status' },
            { status: 500 }
        );
    }
}
