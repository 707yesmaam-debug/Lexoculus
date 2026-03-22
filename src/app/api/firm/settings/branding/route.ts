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

        const firmMember = await (prisma as any).firmMember.findUnique({
            where: { user_id: user.id },
            include: { firm: true }
        });

        if (!firmMember) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({
            firm: firmMember.firm
        });
    } catch (error) {
        console.error('Branding GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const firmMember = await (prisma as any).firmMember.findUnique({
            where: { user_id: user.id }
        });

        if (!firmMember) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, logo_url, custom_intro, branding_color } = body;

        const updatedFirm = await (prisma as any).firm.update({
            where: { id: (firmMember as any).firm_id },
            data: {
                name,
                logo_url,
                custom_intro,
                branding_color
            }
        });

        return NextResponse.json({
            success: true,
            firm: updatedFirm
        });
    } catch (error) {
        console.error('Branding POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
