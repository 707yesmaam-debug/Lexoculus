/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/grant-firm/route';
import { prisma } from '@/lib/infra/prisma';
import { checkAdminAccess } from '@/lib/platform/admin';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/infra/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
        subscription: {
            upsert: jest.fn(),
        },
    },
}));

jest.mock('@/lib/platform/admin', () => ({
    checkAdminAccess: jest.fn(),
}));

describe('Admin Grant API (/api/admin/grant-firm)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.ADMIN_API_KEY = 'test_key';
    });

    const createRequest = (body: any, authHeader = 'Bearer test_key') => {
        return new NextRequest('http://localhost:3000/api/admin/grant-firm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify(body),
        });
    };

    it('should return 401 if API key is missing or incorrect', async () => {
        const req = createRequest({}, 'Bearer wrong_key');
        const res = await POST(req);
        expect(res.status).toBe(401);
    });

    it('should grant a firm subscription with the specified seat count', async () => {
        const mockUser = { id: 'user_123', email: 'firm@test.com', account_type: 'firm' };
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        (prisma.subscription.upsert as jest.Mock).mockResolvedValue({ id: 'sub_123', client_limit: 10 });

        const req = createRequest({
            email: 'firm@test.com',
            clientSeats: 10,
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.seats).toBe(10);

        // Verify prisma.subscription.upsert was called with correct limits (scaled by 10)
        expect(prisma.subscription.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { user_id: 'user_123' },
                create: expect.objectContaining({
                    client_limit: 10,
                    repos_limit: 50,
                    scans_limit: 300,
                    payment_subscription_id: expect.any(String),
                }),
                update: expect.objectContaining({
                    client_limit: 10,
                    repos_limit: 50,
                    scans_limit: 300,
                }),
            })
        );
    });

    it('should return 404 if user email not found', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const req = createRequest({
            email: 'nonexistent@test.com',
            seats: 5,
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(404);
        expect(data.error).toEqual(expect.stringContaining('User not found'));
    });
});
