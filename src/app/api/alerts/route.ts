'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * GET /api/alerts
 * List all alerts for the current user
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // unread, read, resolved, dismissed
        const category = searchParams.get('category');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: Record<string, unknown> = { user_id: user.id };
        if (status) where.status = status;
        if (category) where.category = category;

        const alerts = await prisma.monitoringAlert.findMany({
            where,
            include: {
                ai_system: {
                    select: { id: true, name: true, risk_classification: true }
                }
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });

        // Count unread
        const unreadCount = await prisma.monitoringAlert.count({
            where: { user_id: user.id, status: 'unread' }
        });

        return NextResponse.json({
            alerts,
            unread_count: unreadCount,
        });

    } catch (error) {
        console.error('Alerts list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch alerts' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/alerts
 * Create a new alert (internal use - triggered by system events)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ai_system_id, category, severity, title, message, metadata } = await request.json();

        if (!category || !title || !message) {
            return NextResponse.json(
                { error: 'category, title, and message required' },
                { status: 400 }
            );
        }

        // Validate category
        const validCategories = ['risk_change', 'drift_detected', 'compliance_gap', 'document_missing'];
        if (!validCategories.includes(category)) {
            return NextResponse.json(
                { error: 'Invalid category' },
                { status: 400 }
            );
        }

        const alert = await prisma.monitoringAlert.create({
            data: {
                user_id: user.id,
                ai_system_id,
                category,
                severity: severity || 'info',
                title,
                message,
                metadata,
            }
        });

        console.log(`🔔 [ALERT] Created ${category} alert for user ${user.id}`);

        return NextResponse.json(alert, { status: 201 });

    } catch (error) {
        console.error('Alert creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create alert' },
            { status: 500 }
        );
    }
}
