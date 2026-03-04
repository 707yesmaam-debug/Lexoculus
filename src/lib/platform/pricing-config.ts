export interface PricingTier {
    monthly: number;
    yearly: number;
    currency: string;
    symbol: string;
}

// Default to single global pricing (EU-based)
export const PRICING_CONFIG: PricingTier = {
    monthly: 99,
    yearly: 999,
    currency: 'EUR',
    symbol: '€'
};

export const DEFAULT_CURRENCY = 'EUR';

