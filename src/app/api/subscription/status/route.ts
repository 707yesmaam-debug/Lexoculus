import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getUsageStatus } from '@/lib/subscription';

export async function GET(request: NextRequest) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const usageStatus = await getUsageStatus(user.id);
        return NextResponse.json(usageStatus);
    } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
