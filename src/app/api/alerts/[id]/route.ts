'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/alerts/:id
 * Get a specific alert
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const alert = await prisma.monitoringAlert.findUnique({
            where: { id },
            include: {
                ai_system: {
                    select: { id: true, name: true, risk_classification: true }
                }
            }
        });

        if (!alert) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }

        if (alert.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(alert);

    } catch (error) {
        console.error('Alert fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch alert' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/alerts/:id
 * Update alert status (read, resolved, dismissed)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const alert = await prisma.monitoringAlert.findUnique({
            where: { id },
            select: { user_id: true }
        });

        if (!alert) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }

        if (alert.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status } = await request.json();

        const validStatuses = ['unread', 'read', 'resolved', 'dismissed'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status' },
                { status: 400 }
            );
        }

        const updateData: Record<string, unknown> = { status };

        if (status === 'resolved') {
            updateData.resolved_at = new Date();
            updateData.resolved_by = user.id;
        }

        const updated = await prisma.monitoringAlert.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error('Alert update error:', error);
        return NextResponse.json(
            { error: 'Failed to update alert' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const alert = await prisma.monitoringAlert.findUnique({
            where: { id },
            select: { user_id: true }
        });

        if (!alert) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
        }

        if (alert.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.monitoringAlert.delete({ where: { id } });

        return NextResponse.json({ message: 'Alert deleted' });

    } catch (error) {
        console.error('Alert delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete alert' },
            { status: 500 }
        );
    }
}
