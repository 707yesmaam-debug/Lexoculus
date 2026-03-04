import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import { deriveRepoSecret } from '@/lib/github/github-security';
import { getUsageStatus } from '@/lib/platform/subscription';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check Pro status
        const usageStatus = await getUsageStatus(user.id);
        if (!usageStatus.is_pro) {
            return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const repoFullName = searchParams.get('repo');

        if (!repoFullName) {
            return NextResponse.json({ error: 'Repository name required' }, { status: 400 });
        }

        // Return the deterministic secret for this repo
        const secret = deriveRepoSecret(repoFullName);

        return NextResponse.json({ secret });
    } catch (error) {
        console.error('Failed to get webhook secret:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
