import DodoPayments from 'dodopayments';

const apiKey = process.env.DODO_PAYMENTS_API_KEY || '';
const mode = (process.env.DODO_PAYMENTS_MODE as 'live_mode' | 'test_mode') ||
    (process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode');

// Diagnostic logging
if (!apiKey) {
    console.warn('⚠️ [Dodo Config] API Key is MISSING');
} else {
    console.log(`✅ [Dodo Config] Mode: ${mode}`);
    console.log(`🔑 [Dodo Config] Key Prefix: ${apiKey.substring(0, 8)}...`);
}

// Initialize Dodo Payments client
// Docs: https://docs.dodopayments.com/
export const dodo = new DodoPayments({
    bearerToken: apiKey,
    environment: mode,
});

export const DODO_PRODUCT_ID_PRO = process.env.DODO_PAYMENTS_PRODUCT_ID_PRO || '';
