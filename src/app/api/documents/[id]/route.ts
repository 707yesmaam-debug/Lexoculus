'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/:id
 * Get a specific document
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const document = await prisma.complianceDocument.findUnique({
            where: { id },
            include: {
                ai_system: {
                    select: { id: true, name: true, user_id: true }
                }
            }
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        if (document.ai_system.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(document);

    } catch (error) {
        console.error('Document fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch document' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/documents/:id
 * Update document content (user edits)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const document = await prisma.complianceDocument.findUnique({
            where: { id },
            include: {
                ai_system: { select: { user_id: true } }
            }
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        if (document.ai_system.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { content, missing_fields, completion_percent } = await request.json();

        const updated = await prisma.complianceDocument.update({
            where: { id },
            data: {
                content: content ? { markdown: content } : undefined,
                missing_fields: missing_fields || [],
                completion_percent: completion_percent ?? document.completion_percent,
                status: (completion_percent ?? document.completion_percent) === 100 ? 'complete' : 'draft',
                version: { increment: 1 },
            }
        });

        return NextResponse.json({
            document_id: updated.id,
            status: updated.status,
            version: updated.version,
            completion_percent: updated.completion_percent,
        });

    } catch (error) {
        console.error('Document update error:', error);
        return NextResponse.json(
            { error: 'Failed to update document' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const document = await prisma.complianceDocument.findUnique({
            where: { id },
            include: {
                ai_system: { select: { user_id: true } }
            }
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        if (document.ai_system.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.complianceDocument.delete({ where: { id } });

        return NextResponse.json({ message: 'Document deleted' });

    } catch (error) {
        console.error('Document delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete document' },
            { status: 500 }
        );
    }
}
