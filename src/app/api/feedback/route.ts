import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        const body = await req.json();
        const { rating, comment, url } = body;

        await prisma.feedback.create({
            data: {
                user_id: user?.id, // Can be null (anonymous)
                rating,
                comment,
                page_url: url,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Feedback error:', error);
        return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }
}
