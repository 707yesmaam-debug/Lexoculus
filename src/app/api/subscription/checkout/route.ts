import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createCheckoutSession } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const supabase = await createServerClient();
        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser || !authUser.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user details from our database
        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Create Checkout Session
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const { url, error } = await createCheckoutSession(
            user.id,
            user.email,
            user.full_name || undefined,
            `${baseUrl}/dashboard?checkout=success`
        );

        if (error || !url) {
            return NextResponse.json({ error: error || 'Failed to create checkout session' }, { status: 500 });
        }

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Dodo Checkout Error:', error);
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        );
    }
}
