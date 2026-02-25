'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * POST /api/ai-systems/:id/share
 * Enable sharing and generate a public share ID
 */
export async function POST(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const aiSystem = await prisma.aiSystem.findUnique({
            where: { id }
        });

        if (!aiSystem) {
            return NextResponse.json({ error: 'AI system not found' }, { status: 404 });
        }

        if (aiSystem.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Generate share ID if not exists, enable sharing
        const shareId = aiSystem.public_share_id || nanoid(12);

        const updated = await prisma.aiSystem.update({
            where: { id },
            data: {
                public_share_id: shareId,
                share_enabled: true,
            }
        });

        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lexoculus.com'}/status/${shareId}`;

        console.log(`[SUCCESS] [SHARE] Enabled sharing for ${aiSystem.name}: ${shareUrl}`);

        return NextResponse.json({
            share_id: shareId,
            share_url: shareUrl,
            share_enabled: true,
            message: 'Sharing enabled successfully'
        });

    } catch (error) {
        console.error('Share enable error:', error);
        return NextResponse.json(
            { error: 'Failed to enable sharing' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/ai-systems/:id/share
 * Disable sharing (keep share ID for re-enable)
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
        const aiSystem = await prisma.aiSystem.findUnique({
            where: { id }
        });

        if (!aiSystem) {
            return NextResponse.json({ error: 'AI system not found' }, { status: 404 });
        }

        if (aiSystem.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.aiSystem.update({
            where: { id },
            data: { share_enabled: false }
        });

        console.log(`[SECURE] [SHARE] Disabled sharing for ${aiSystem.name}`);

        return NextResponse.json({
            share_enabled: false,
            message: 'Sharing disabled'
        });

    } catch (error) {
        console.error('Share disable error:', error);
        return NextResponse.json(
            { error: 'Failed to disable sharing' },
            { status: 500 }
        );
    }
}
