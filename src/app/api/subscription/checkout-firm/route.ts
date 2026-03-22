import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import { createFirmCheckoutSession } from '@/lib/platform/subscription';
import { prisma } from '@/lib/infra/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { quantity = 1 } = body;

        const supabase = await createServerClient();
        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser || !authUser.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let user = await prisma.user.findUnique({
            where: { id: authUser.id },
            include: { firm_member: true }
        });

        if (!user || user.account_type !== 'firm') {
            return NextResponse.json({ error: 'User is not a law firm' }, { status: 403 });
        }

        // Create Checkout Session for additional seats
        const { url, error } = await createFirmCheckoutSession(
            user.id,
            user.email,
            quantity,
            user.full_name || undefined
        );

        if (error || !url) {
            return NextResponse.json({ error: error || 'Failed to create checkout session' }, { status: 500 });
        }

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Firm Checkout Error:', error);
        return NextResponse.json(
            { error: 'Failed to create firm checkout session' },
            { status: 500 }
        );
    }
}
