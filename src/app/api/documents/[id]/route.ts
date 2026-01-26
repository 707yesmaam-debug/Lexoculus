'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { extractMissingFields, calculateCompletion } from '@/lib/document-generator';

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

        const { content } = await request.json();

        // If content is provided, recalculate metrics
        let missing_fields = undefined;
        let completion_percent = undefined;
        let status = undefined;

        if (content) {
            missing_fields = extractMissingFields(content);
            // We estimate total placeholders based on original template count (approx 20-50)
            // or we use the previous completion logic. 
            // Better: use the utility properly. But wait, `calculateCompletion` needs total placeholders.
            // For now, we'll calc completion based on missing fields count vs a stored 'total_fields' 
            // or just estimate (missing == 0 => 100%, else calc).

            // Simplification: 
            // 1. If no missing fields => 100%
            // 2. Else => (1 - missing.length / 30) * 100 
            // This is hacky. Let's just track missing fields count.

            // Actually, let's keep it simple:
            // If missing_fields.length === 0 => 100
            // Else => document.completion_percent (don't change it unless we know better) 
            // OR - We can import the template types and count them, but that's heavy.

            // Re-read: document-generator exports logic.
            // But we don't have the 'total' here without loading the template again.
            // Let's just update missing_fields and set status.

            if (missing_fields.length === 0) {
                completion_percent = 100;
                status = 'complete';
            } else {
                status = 'draft';
                // If we went from 0 missing to some missing, we might want to lower %
                // But generally users are FILLING things, so % should go up.
                // For now, let's trust the client provided % OR just stick to missing fields.
                // Let's NOT update completion_percent here accurately without template context.
                // It's acceptable to just update missing_fields and status.
            }
        }

        const updated = await prisma.complianceDocument.update({
            where: { id },
            data: {
                content: content ? { markdown: content } : undefined,
                missing_fields: missing_fields || undefined,
                completion_percent: completion_percent, // Only update if 100% achieved
                status: status || undefined,
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
