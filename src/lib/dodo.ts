import DodoPayments from 'dodopayments';

// Initialize Dodo Payments client
// Docs: https://docs.dodopayments.com/
export const dodo = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY || '',
    environment: (process.env.DODO_PAYMENTS_MODE as 'live_mode' | 'test_mode') || (process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode'),
});

export const DODO_PRODUCT_ID_PRO = process.env.DODO_PAYMENTS_PRODUCT_ID_PRO || '';
