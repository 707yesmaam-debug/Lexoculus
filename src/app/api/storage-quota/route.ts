/**
 * GET /api/storage-quota
 * 
 * Returns Supabase Storage usage for monitoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import { checkStorageUsage } from '@/lib/infra/storage';

export async function GET(req: NextRequest) {
    try {
        // Authenticate user
        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const usage = await checkStorageUsage();

        return NextResponse.json({
            used: usage.used,
            limit: usage.limit,
            percentage: Math.round(usage.percentage * 10) / 10,
            can_store: usage.canStore,
            used_mb: Math.round(usage.used / 1024 / 1024 * 100) / 100,
            limit_mb: Math.round(usage.limit / 1024 / 1024),
        });

    } catch (error) {
        console.error('[Storage Quota] Error:', error);
        return NextResponse.json(
            { error: 'Failed to check storage' },
            { status: 500 }
        );
    }
}
