'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';
import crypto from 'crypto';

/**
 * GET /api/evidence
 * List evidence for user's AI Systems
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const aiSystemId = searchParams.get('ai_system_id');
        const evidenceType = searchParams.get('evidence_type');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: Record<string, unknown> = { user_id: user.id };
        if (aiSystemId) where.ai_system_id = aiSystemId;
        if (evidenceType) where.evidence_type = evidenceType;

        const evidence = await prisma.complianceEvidence.findMany({
            where,
            include: {
                ai_system: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { collected_at: 'desc' },
            take: limit,
        });

        return NextResponse.json({
            evidence,
            total: evidence.length,
        });

    } catch (error) {
        console.error('Evidence list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch evidence' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/evidence
 * Create/upload new evidence
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            ai_system_id,
            evidence_type,
            title,
            description,
            file_url,
            file_name,
            file_size,
            mime_type,
            source_type,
            source_id,
            content_hash, // Client can provide pre-computed hash
        } = body;

        if (!ai_system_id || !evidence_type || !title) {
            return NextResponse.json(
                { error: 'ai_system_id, evidence_type, and title required' },
                { status: 400 }
            );
        }

        // Verify ownership
        const aiSystem = await prisma.aiSystem.findUnique({
            where: { id: ai_system_id },
            select: { user_id: true }
        });

        if (!aiSystem || aiSystem.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Generate hash from content or use provided
        const hash = content_hash || crypto.createHash('sha256')
            .update(JSON.stringify({ title, description, file_url, timestamp: new Date().toISOString() }))
            .digest('hex');

        const evidence = await prisma.complianceEvidence.create({
            data: {
                user_id: user.id,
                ai_system_id,
                evidence_type,
                title,
                description,
                file_url,
                file_name,
                file_size,
                mime_type,
                source_type,
                source_id,
                collected_by: user.id,
                hash,
            }
        });

        console.log(`📎 [EVIDENCE] Created ${evidence_type} evidence for AI system ${ai_system_id}`);

        return NextResponse.json(evidence, { status: 201 });

    } catch (error) {
        console.error('Evidence creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create evidence' },
            { status: 500 }
        );
    }
}
