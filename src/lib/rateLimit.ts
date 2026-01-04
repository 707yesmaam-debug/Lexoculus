// In-memory rate limiter
// In production, use Redis or a distributed cache

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

interface RateLimitConfig {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;
}

export const RATE_LIMITS = {
    REPO_SCAN: { windowMs: 60 * 60 * 1000, maxRequests: 10 },      // 10 scans per hour
    REPO_LIST: { windowMs: 60 * 60 * 1000, maxRequests: 30 },      // 30 list requests per hour
} as const;

/**
 * Check if a user has exceeded their rate limit
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
    userId: string,
    action: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetAt: number } {
    const config = RATE_LIMITS[action];
    const key = `${userId}:${action}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    // If no entry or window expired, create/reset
    if (!entry || now >= entry.resetAt) {
        const newEntry: RateLimitEntry = {
            count: 1,
            resetAt: now + config.windowMs,
        };
        rateLimitStore.set(key, newEntry);
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetAt: newEntry.resetAt,
        };
    }

    // Check if within limit
    if (entry.count < config.maxRequests) {
        entry.count++;
        return {
            allowed: true,
            remaining: config.maxRequests - entry.count,
            resetAt: entry.resetAt,
        };
    }

    // Rate limit exceeded
    return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
    };
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitResponse(resetAt: number): Response {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

    return new Response(
        JSON.stringify({
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again in ${Math.ceil(retryAfter / 60)} minutes.`,
            retryAfter,
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
