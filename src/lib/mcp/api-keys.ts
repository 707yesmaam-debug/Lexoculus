/**
 * MCP API Key Management
 *
 * Generates, validates, and revokes API keys for the LexOculus MCP cloud relay.
 * Keys use the format: lx_<32 random hex chars> (e.g. lx_a1b2c3d4e5f6...)
 * Only the SHA-256 hash is stored in the database.
 */

import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/infra/prisma';

const KEY_PREFIX = 'lx_';

/**
 * Generate a new MCP API key for a user.
 * Returns the plaintext key ONCE — it is never stored.
 */
export async function generateApiKey(
    userId: string,
    name: string = 'Default',
): Promise<{ id: string; key: string; prefix: string }> {
    // Generate 32 random bytes → 64 hex chars
    const rawKey = randomBytes(32).toString('hex');
    const fullKey = `${KEY_PREFIX}${rawKey}`;

    // Hash for storage
    const keyHash = createHash('sha256').update(fullKey).digest('hex');
    const keyPrefix = fullKey.substring(0, 11); // "lx_" + first 8 hex chars

    const record = await prisma.mcpApiKey.create({
        data: {
            user_id: userId,
            key_hash: keyHash,
            key_prefix: keyPrefix,
            name,
        },
    });

    return {
        id: record.id,
        key: fullKey,        // Only returned once!
        prefix: keyPrefix,
    };
}

/**
 * Validate an API key. Returns the userId if valid, null otherwise.
 * Also updates last_used_at timestamp.
 */
export async function validateApiKey(key: string): Promise<string | null> {
    if (!key.startsWith(KEY_PREFIX)) return null;

    const keyHash = createHash('sha256').update(key).digest('hex');

    const record = await prisma.mcpApiKey.findUnique({
        where: { key_hash: keyHash },
    });

    if (!record) return null;
    if (record.revoked_at) return null;

    // Update last_used_at (fire-and-forget, don't block the response)
    prisma.mcpApiKey.update({
        where: { id: record.id },
        data: { last_used_at: new Date() },
    }).catch(() => {/* non-critical */ });

    return record.user_id;
}

/**
 * List all API keys for a user (returns metadata only, never the full key).
 */
export async function listApiKeys(userId: string) {
    return prisma.mcpApiKey.findMany({
        where: { user_id: userId },
        select: {
            id: true,
            key_prefix: true,
            name: true,
            created_at: true,
            last_used_at: true,
            revoked_at: true,
        },
        orderBy: { created_at: 'desc' },
    });
}

/**
 * Revoke an API key (soft-delete). Only the owning user can revoke their own keys.
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const result = await prisma.mcpApiKey.updateMany({
        where: {
            id: keyId,
            user_id: userId,
            revoked_at: null, // Only revoke active keys
        },
        data: { revoked_at: new Date() },
    });

    return result.count > 0;
}
