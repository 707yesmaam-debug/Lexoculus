
import { DodoPayments } from 'dodopayments';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testDodo() {
    const apiKey = process.env.DODO_PAYMENTS_API_KEY || '';
    const mode = (process.env.DODO_PAYMENTS_MODE as 'live_mode' | 'test_mode') || 'test_mode';
    
    console.log(`Testing Dodo with mode: ${mode}`);
    console.log(`Key prefix: ${apiKey.substring(0, 10)}...`);

    const dodo = new DodoPayments({
        bearerToken: apiKey,
        environment: mode,
    });

    try {
        const session = await dodo.checkoutSessions.create({
            product_cart: [{
                product_id: process.env.DODO_FIRM_PRODUCT_ID || '',
                quantity: 1,
            }],
            customer: {
                email: 'test@example.com',
            },
            return_url: 'http://localhost:3000',
        });
        console.log('Success! Checkout URL:', session.checkout_url);
    } catch (error: any) {
        console.error('FAILED with error:');
        console.error('Message:', error.message);
        console.error('Status:', error.status);
        console.error('Stack:', error.stack);
    }
}

testDodo();
