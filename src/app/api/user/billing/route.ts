import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getCustomerPortalUrl } from '@/lib/subscription';

export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url, error } = await getCustomerPortalUrl(user.id);

        if (error || !url) {
            return NextResponse.json(
                { error: error || 'Failed to generate portal URL' },
                { status: 400 }
            );
        }

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Billing Portal Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
