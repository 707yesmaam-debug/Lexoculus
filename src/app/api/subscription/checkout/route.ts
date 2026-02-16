import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/subscription';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user from DB to check if they already have a customer ID
        // (Optional: reusing customer ID if we stored it, but for now we'll let Dodo handle it)
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Create Checkout Session
        const { url, error } = await createCheckoutSession(
            user.id,
            user.email,
            user.full_name || undefined,
            `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`
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
