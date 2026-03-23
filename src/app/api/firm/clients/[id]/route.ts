import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/infra/prisma';
import { createServerClient } from '@/lib/infra/supabase-server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        
        const client = await prisma.firmClient.findUnique({
            where: { id },
        });

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json(client);

    } catch (error) {
        console.error('Error fetching client details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
