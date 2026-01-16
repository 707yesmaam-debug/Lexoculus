export type Region = 'EU' | 'US' | 'UK' | 'APAC';

export interface PricingTier {
    monthly: number;
    yearly: number;
    currency: string;
    symbol: string;
}

export const REGIONAL_PRICING: Record<Region, PricingTier> = {
    EU: {
        monthly: 91,
        yearly: 917,
        currency: 'EUR',
        symbol: '€'
    },
    US: {
        monthly: 99,
        yearly: 999,
        currency: 'USD',
        symbol: '$'
    },
    UK: {
        monthly: 79,
        yearly: 799,
        currency: 'GBP',
        symbol: '£'
    },
    APAC: {
        monthly: 89,
        yearly: 899,
        currency: 'USD',
        symbol: '$'
    }
};

export const DEFAULT_REGION: Region = 'EU';

export function getPricingForRegion(countryCode?: string): { region: Region, pricing: PricingTier } {
    if (!countryCode) {
        return { region: DEFAULT_REGION, pricing: REGIONAL_PRICING[DEFAULT_REGION] };
    }

    const code = countryCode.toUpperCase();
    let region: Region = 'APAC'; // Default fallback

    // Simple mapping (can be expanded)
    const euCountries = ['DE', 'FR', 'IT', 'ES', 'PL', 'RO', 'NL', 'BE', 'GR', 'CZ', 'PT', 'SE', 'HU', 'AT', 'BG', 'DK', 'FI', 'SK', 'IE', 'HR', 'LT', 'SI', 'LV', 'EE', 'CY', 'LU', 'MT'];

    if (code === 'US' || code === 'CA') {
        region = 'US';
    } else if (code === 'GB') {
        region = 'UK';
    } else if (euCountries.includes(code)) {
        region = 'EU';
    }

    // Default to EU if no match found (safest for GDPR context)
    if (!['US', 'UK', 'EU', 'APAC'].includes(region)) {
        region = 'EU';
    }

    return { region, pricing: REGIONAL_PRICING[region] };
}
