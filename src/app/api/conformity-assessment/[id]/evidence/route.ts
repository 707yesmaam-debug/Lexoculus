import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/conformity-assessment/:id/evidence
 * Get all evidence uploaded for a specific conformity assessment
 */
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params;

        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const evidence = await prisma.complianceEvidence.findMany({
            where: {
                conformity_assessment_id: id,
                user_id: user.id
            },
            orderBy: { collected_at: 'desc' }
        });

        return NextResponse.json({ evidence });

    } catch (error) {
        console.error('Fetch conformity evidence error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch conformity evidence' },
            { status: 500 }
        );
    }
}
