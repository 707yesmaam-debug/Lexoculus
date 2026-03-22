/**
 * @jest-environment node
 */
import { createFirmCheckoutSession, TIER_LIMITS } from '@/lib/platform/subscription';
import { dodo } from '@/lib/platform/dodo';

// Mock Dodo SDK
jest.mock('@/lib/platform/dodo', () => ({
    dodo: {
        checkoutSessions: {
            create: jest.fn(),
        },
    },
}));

describe('Subscription Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.DODO_FIRM_PRODUCT_ID = 'prod_firm_123';
    });

    describe('createFirmCheckoutSession', () => {
        it('should create a Dodo checkout session with the correct quantity', async () => {
            const mockUrl = 'https://checkout.dodopayments.com/test';
            (dodo.checkoutSessions.create as jest.Mock).mockResolvedValue({
                checkout_url: mockUrl,
            });

            const result = await createFirmCheckoutSession(
                'user_123',
                'test@firm.com',
                5,
                'Test Firm'
            );

            expect(dodo.checkoutSessions.create).toHaveBeenCalledWith({
                product_cart: [{
                    product_id: 'prod_firm_123',
                    quantity: 5,
                }],
                customer: {
                    email: 'test@firm.com',
                    name: 'Test Firm',
                },
                metadata: {
                    userId: 'user_123',
                },
                return_url: expect.stringContaining('/firm/settings/billing?checkout=success'),
            });

            expect(result.url).toBe(mockUrl);
        });

        it('should return an error if Dodo session creation fails', async () => {
            (dodo.checkoutSessions.create as jest.Mock).mockRejectedValue(new Error('Dodo error'));

            const result = await createFirmCheckoutSession(
                'user_123',
                'test@firm.com',
                1
            );

            expect(result.error).toBe('Dodo error'); // The implementation returns error.message
            expect(result.url).toBeNull();
        });
    });

    describe('TIER_LIMITS Scaling', () => {
        it('should have standard pro limits defined', () => {
            expect(TIER_LIMITS.pro).toBeDefined();
            expect(TIER_LIMITS.pro.repos_limit).toBe(5);
            expect(TIER_LIMITS.pro.scans_limit).toBe(30);
            expect(TIER_LIMITS.pro.pr_scans_limit).toBe(50);
            expect(TIER_LIMITS.pro.reports_limit).toBe(20);
        });
    });
});
