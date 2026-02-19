import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createCheckoutSession } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { billingCycle } = body;

        const supabase = await createServerClient();
        const {
            data: { user: authUser },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser || !authUser.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user details from our database, or create if missing (self-healing)
        let user = await prisma.user.findUnique({
            where: { id: authUser.id },
        });

        if (!user) {
            // User exists in Supabase Auth but not in public.users table
            // This can happen if the handle_new_user trigger failed or doesn't exist
            console.warn(`[CHECKOUT] User ${authUser.id} missing from public.users, creating fallback record`);
            user = await prisma.user.create({
                data: {
                    id: authUser.id,
                    email: authUser.email!,
                    full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
                },
            });
        }

        // Create Checkout Session
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const { url, error } = await createCheckoutSession(
            user.id,
            user.email,
            user.full_name || undefined,
            `${baseUrl}/dashboard?checkout=success`,
            billingCycle
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
