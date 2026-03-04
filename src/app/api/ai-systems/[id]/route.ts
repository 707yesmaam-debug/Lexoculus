'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/ai-systems/:id
 * Get a single AI system by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const aiSystem = await prisma.aiSystem.findUnique({
            where: { id },
            include: {
                latest_scan: {
                    include: {
                        llm_analysis: true,
                        risk_assessment: true,
                        final_risk_assessment: {
                            include: {
                                compliance_report: true,
                            }
                        },
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

        return NextResponse.json({ ai_system: aiSystem });

    } catch (error) {
        console.error('AI System get error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch AI system' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/ai-systems/:id
 * Update an AI system
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const existing = await prisma.aiSystem.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'AI system not found' }, { status: 404 });
        }

        if (existing.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, status, lifecycle_stage } = body;

        // If name is being changed, check for duplicates
        if (name && name !== existing.name) {
            const duplicate = await prisma.aiSystem.findUnique({
                where: {
                    user_id_name: {
                        user_id: user.id,
                        name: name.trim()
                    }
                }
            });

            if (duplicate) {
                return NextResponse.json(
                    { error: 'An AI system with this name already exists' },
                    { status: 409 }
                );
            }
        }

        const updated = await prisma.aiSystem.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(description !== undefined && { description }),
                ...(status && { status }),
                ...(lifecycle_stage && { lifecycle_stage }),
            }
        });

        console.log(`[SUCCESS] [AI_SYSTEM] Updated: ${updated.name} (${updated.id})`);

        return NextResponse.json({
            ai_system: updated,
            message: 'AI system updated successfully'
        });

    } catch (error) {
        console.error('AI System update error:', error);
        return NextResponse.json(
            { error: 'Failed to update AI system' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/ai-systems/:id
 * Archive an AI system (soft delete)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const existing = await prisma.aiSystem.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'AI system not found' }, { status: 404 });
        }

        if (existing.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Soft delete by setting status to archived
        await prisma.aiSystem.update({
            where: { id },
            data: { status: 'archived' }
        });

        console.log(`🗑 [AI_SYSTEM] Archived: ${existing.name} (${id})`);

        return NextResponse.json({
            message: 'AI system archived successfully'
        });

    } catch (error) {
        console.error('AI System delete error:', error);
        return NextResponse.json(
            { error: 'Failed to archive AI system' },
            { status: 500 }
        );
    }
}
