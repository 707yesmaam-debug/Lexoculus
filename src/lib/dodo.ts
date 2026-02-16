import DodoPayments from 'dodopayments';

// Initialize Dodo Payments client
// Docs: https://docs.dodopayments.com/
export const dodo = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY || '', // API Key from Dodo Dashboard
    environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode', // 'live_mode' or 'test_mode'
});

export const DODO_PRODUCT_ID_PRO = process.env.DODO_PAYMENTS_PRODUCT_ID_PRO || '';
