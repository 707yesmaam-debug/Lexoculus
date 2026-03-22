'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';
import { verifyAuditChain } from '@/lib/security/audit-logger';

/**
 * GET /api/audit-logs
 * List audit logs with filtering
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user from Prisma for account_type
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const aiSystemId = searchParams.get('ai_system_id');
        const action = searchParams.get('action');
        const entityType = searchParams.get('entity_type');
        const firmClientId = searchParams.get('firm_client_id');
        const limit = parseInt(searchParams.get('limit') || '100');
        const verifyChain = searchParams.get('verify') === 'true';

        const where: any = { user_id: user.id };
        if (firmClientId) {
            where.firm_client_id = firmClientId;
        } else if ((dbUser as any).account_type !== 'firm') {
            where.firm_id = null;
        }
        
        if (aiSystemId) where.ai_system_id = aiSystemId;
        if (action) where.action = action;
        if (entityType) where.entity_type = entityType;
        
        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                ai_system: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });

        // Optionally verify chain integrity
        let chainStatus = null;
        if (verifyChain) {
            chainStatus = await verifyAuditChain(user.id);
        }

        return NextResponse.json({
            logs,
            total: logs.length,
            chain_verified: chainStatus,
        });

    } catch (error) {
        console.error('Audit logs list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch audit logs' },
            { status: 500 }
        );
    }
}
