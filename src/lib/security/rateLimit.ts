import { Redis } from '@upstash/redis';

// =============================================================================
// CONFIGURATION
// =============================================================================

export const RATE_LIMITS = {
    REPO_SCAN: { windowMs: 60 * 60 * 1000, maxRequests: 10, name: 'repo_scan' },
    REPO_LIST: { windowMs: 60 * 60 * 1000, maxRequests: 30, name: 'repo_list' },
    // Lower limits for expensive operations
    LLM_ANALYSIS: { windowMs: 60 * 60 * 1000, maxRequests: 20, name: 'llm_analysis' },
    // Anonymous scan: 1 per IP per day (24h window)
    ANONYMOUS_SCAN: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 1, name: 'anonymous_scan' },
} as const;

// =============================================================================
// REDIS CLIENT (Lazy Init)
// =============================================================================

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
} else {
    if (process.env.NODE_ENV === 'production') {
        if (process.env.NODE_ENV === 'production') {
            const logger = require('../infra/logger').default;
            logger.warn('[WARN] [RATE_LIMIT] Redis credentials missing in production! Falling back to in-memory store (not scalable).');
        }
    }
}

// =============================================================================
// IN-MEMORY FALLBACK (For local/dev or Redis outage)
// =============================================================================

interface RateLimitEntry {
    count: number;
    resetAt: number;
}
const memoryStore = new Map<string, RateLimitEntry>();

// =============================================================================
// RATE LIMITER LOGIC
// =============================================================================

/**
 * Check if a user has exceeded their rate limit
 */
export async function checkRateLimit(
    userId: string,
    action: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const config = RATE_LIMITS[action];
    const key = `ratelimit:${config.name}:${userId}`;
    const now = Date.now();
    const windowSeconds = Math.ceil(config.windowMs / 1000);

    // 1. Try REDIS
    if (redis) {
        try {
            // Atomic increment
            const count = await redis.incr(key);

            // If new key, set expiration
            if (count === 1) {
                await redis.expire(key, windowSeconds);
            }

            // Calculate remaining
            const remaining = Math.max(0, config.maxRequests - count);

            // Get TTL for accurate reset time
            const ttl = await redis.ttl(key);
            const resetAt = now + (ttl * 1000);

            return {
                allowed: count <= config.maxRequests,
                remaining,
                resetAt,
            };

        } catch (error) {
            if (process.env.NODE_ENV === 'production') {
                const logger = require('../infra/logger').default;
                logger.error({ err: error }, '[ERROR] [RATE_LIMIT] Redis error, falling back to memory');
            } else {
                console.error('Redis error', error);
            }
            // Fall through to memory store
        }
    }

    // 2. Fallback: IN-MEMORY
    const entry = memoryStore.get(key);

    // If new or expired
    if (!entry || now >= entry.resetAt) {
        const newEntry = {
            count: 1,
            resetAt: now + config.windowMs,
        };
        memoryStore.set(key, newEntry);
        return { allowed: true, remaining: config.maxRequests - 1, resetAt: newEntry.resetAt };
    }

    // Increment existing
    entry.count++;
    const remaining = Math.max(0, config.maxRequests - entry.count);

    return {
        allowed: entry.count <= config.maxRequests,
        remaining,
        resetAt: entry.resetAt,
    };
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitResponse(resetAt: number): Response {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000); // Seconds

    return new Response(
        JSON.stringify({
            error: 'Rate limit exceeded',
            message: `Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
            retryAfter, // For client logic
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(retryAfter),
            },
        }
    );
}
