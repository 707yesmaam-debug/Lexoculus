/**
 * Smoke Test: Rate Limiter Logic
 */
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

// Mock Recis to force fallback or use memory
jest.mock('@upstash/redis', () => ({
    Redis: jest.fn().mockImplementation(() => ({
        incr: jest.fn(),
        expire: jest.fn(),
        ttl: jest.fn(),
    })),
}));

describe('Rate Limiter (Smoke Test)', () => {
    it('should allow request within limit', async () => {
        // We are testing the "in-memory" fallback primarily if Redis envs are missing in test
        // Or we can mock the module internally.

        // For this smoke test, we rely on the fact that without env vars, it falls back to memory.
        const userId = 'test-user-1';
        const action = 'REPO_SCAN'; // limit 10

        const result = await checkRateLimit(userId, action);

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBeLessThan(RATE_LIMITS.REPO_SCAN.maxRequests);
    });

    it('should block after limit exceeded', async () => {
        const userId = 'test-user-blocked';
        const action = 'REPO_SCAN';
        const limit = RATE_LIMITS.REPO_SCAN.maxRequests; // 10

        // Exhaust limit
        for (let i = 0; i < limit; i++) {
            await checkRateLimit(userId, action);
        }

        // Next one should fail
        const result = await checkRateLimit(userId, action);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });
});
