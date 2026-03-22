import { createServerClient } from '@/lib/infra/supabase-server';
import { prisma } from '@/lib/infra/prisma';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

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

        // Fetch authorized client accounts
        const clients = await (prisma as any).firmClient.findMany({
            where: { firm_id: firmMember.firm_id },
            include: { access: true }
        });

        // Fetch API keys for this firm admin
        const apiKeys = await (prisma as any).mcpApiKey.findMany({
            where: { user_id: user.id, revoked_at: null },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json({
            authorized_accounts: clients.filter((c: any) => c.status === 'active').map((c: any) => ({
                id: c.id,
                client_name: c.client_name,
                github_username: c.access?.github_username || 'Authorized Account',
                granted_at: c.access?.granted_at
            })),
            api_keys: apiKeys
        });
    } catch (error) {
        console.error('Security GET error:', error);
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

        const body = await request.json();
        const { action, key_id, name } = body;

        if (action === 'revoke') {
            await (prisma as any).mcpApiKey.update({
                where: { id: key_id, user_id: user.id },
                data: { revoked_at: new Date() }
            });
            return NextResponse.json({ success: true });
        }

        if (action === 'generate') {
            const rawKey = `lx_${crypto.randomBytes(32).toString('hex')}`;
            const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
            const keyPrefix = rawKey.substring(0, 11); // lx_a1b2c3d4

            const newKey = await (prisma as any).mcpApiKey.create({
                data: {
                    user_id: user.id,
                    name: name || 'Firm API Key',
                    key_hash: keyHash,
                    key_prefix: keyPrefix,
                }
            });

            return NextResponse.json({
                success: true,
                key: rawKey,
                key_prefix: keyPrefix,
                id: newKey.id
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Security POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
