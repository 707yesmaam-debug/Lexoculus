import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import { getUsageStatus } from '@/lib/platform/subscription';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const usageStatus = await getUsageStatus(user.id, user.email);

        return NextResponse.json(usageStatus);
    } catch (error) {
        console.error('Failed to fetch usage:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
