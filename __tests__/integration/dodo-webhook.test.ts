/**
 * @jest-environment node
 */
import { POST } from '@/app/api/webhooks/dodo/route';
import { prisma } from '@/lib/infra/prisma';
import { dodo } from '@/lib/platform/dodo';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Mock dependencies
jest.mock('@/lib/infra/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
        subscription: {
            upsert: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock('@/lib/platform/dodo', () => ({
    dodo: {
        webhooks: {
            unwrap: jest.fn(),
        },
    },
}));

jest.mock('next/headers', () => ({
    headers: jest.fn(),
}));

describe('Dodo Webhook Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (headers as jest.Mock).mockResolvedValue(new Map([['x-dodo-signature', 'test_sig']]));
    });

    const createWebhookRequest = (body: any) => {
        return new Request('http://localhost:3000/api/webhooks/dodo', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    };

    it('should update subscription with scaled limits when quantity > 1', async () => {
        const mockEvent = {
            type: 'subscription.active',
            data: {
                customer: { email: 'firm@test.com', customer_id: 'cust_123' },
                subscription_id: 'sub_123',
                product_id: 'prod_firm_123',
                quantity: 5,
                next_billing_date: '2026-04-22T00:00:00Z',
            },
        };

        (dodo.webhooks.unwrap as jest.Mock).mockReturnValue(mockEvent);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user_123', email: 'firm@test.com' });

        const req = createWebhookRequest(mockEvent);
        const res = await POST(req);

        expect(res.status).toBe(200);
        
        // Verify upsert with scaled limits (5 * base)
        expect(prisma.subscription.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { user_id: 'user_123' },
                create: expect.objectContaining({
                    client_limit: 5,
                    repos_limit: 25, // 5 * 5
                    scans_limit: 150, // 30 * 5
                    pr_scans_limit: 250, // 50 * 5
                    reports_limit: 100, // 20 * 5
                }),
            })
        );
    });

    it('should default to quantity 1 if not provided', async () => {
        const mockEvent = {
            type: 'subscription.active',
            data: {
                customer: { email: 'user@test.com', customer_id: 'cust_456' },
                subscription_id: 'sub_456',
                product_id: 'prod_indiv_456',
                // no quantity
                next_billing_date: '2026-04-22T00:00:00Z',
            },
        };

        (dodo.webhooks.unwrap as jest.Mock).mockReturnValue(mockEvent);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user_456', email: 'user@test.com' });

        const req = createWebhookRequest(mockEvent);
        await POST(req);

        expect(prisma.subscription.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { user_id: 'user_456' },
                create: expect.objectContaining({
                    client_limit: 1,
                    repos_limit: 5,
                }),
            })
        );
    });

    it('should handle subscription cancellations', async () => {
        const mockEvent = {
            type: 'subscription.cancelled',
            data: {
                customer: { email: 'cancel@test.com' },
            },
        };

        (dodo.webhooks.unwrap as jest.Mock).mockReturnValue(mockEvent);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user_789', email: 'cancel@test.com' });

        const req = createWebhookRequest(mockEvent);
        await POST(req);

        expect(prisma.subscription.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { user_id: 'user_789' },
                data: {
                    status: 'active',
                    cancel_at_period_end: true,
                },
            })
        );
    });
});
