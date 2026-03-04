import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import { prisma } from '@/lib/infra/prisma';
import { generateApiKey, listApiKeys, revokeApiKey } from '@/lib/mcp/api-keys';

/**
 * GET /api/mcp/keys — List user's MCP API keys (prefix only)
 */
export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure user exists in our DB
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const keys = await listApiKeys(user.id);
        return NextResponse.json({ keys });
    } catch (error) {
        console.error('[MCP Keys] GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/mcp/keys — Generate a new MCP API key
 * Body: { name?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Limit to 5 active keys per user
        const activeCount = await prisma.mcpApiKey.count({
            where: { user_id: user.id, revoked_at: null },
        });
        if (activeCount >= 5) {
            return NextResponse.json(
                { error: 'Maximum of 5 active API keys allowed. Revoke an existing key first.' },
                { status: 400 },
            );
        }

        const body = await request.json().catch(() => ({}));
        const name = (body as { name?: string }).name || 'Default';

        const result = await generateApiKey(user.id, name);

        return NextResponse.json({
            id: result.id,
            key: result.key,         // Only returned once!
            prefix: result.prefix,
            message: 'Save this key now — it will not be shown again.',
        });
    } catch (error) {
        console.error('[MCP Keys] POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/mcp/keys — Revoke an API key
 * Body: { keyId: string }
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const keyId = (body as { keyId: string }).keyId;
        if (!keyId) {
            return NextResponse.json({ error: 'keyId is required' }, { status: 400 });
        }

        const revoked = await revokeApiKey(keyId, user.id);
        if (!revoked) {
            return NextResponse.json({ error: 'Key not found or already revoked' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[MCP Keys] DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
