import { createServerClient } from '@/lib/infra/supabase-server';
import { prisma } from '@/lib/infra/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { account_type: true },
        });

        if (!dbUser) {
            // User exists in auth but not yet synced to DB (can happen right after signup)
            // Fall back to metadata if available
            const accountType = user.user_metadata?.account_type || 'individual';
            return NextResponse.json({ account_type: accountType });
        }

        return NextResponse.json({ account_type: dbUser.account_type });
    } catch (error) {
        console.error('Error fetching account type:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
