import { shouldSkipHighRiskCategory, PURPOSE_CATEGORY_MAP } from '../../src/lib/compliance/eu-ai-act/purpose-categories';

describe('Purpose Categories Risk Filtering', () => {

    describe('Handling Undefined / Default Purpose', () => {
        it('should NOT skip any category if intended purpose is missing', () => {
            const result = shouldSkipHighRiskCategory('Employment & Worker Management');
            expect(result).toBe(false);
        });

        it('should NOT skip any category if intended purpose is "general" (null map)', () => {
            const result = shouldSkipHighRiskCategory('Critical Infrastructure', 'general');
            expect(result).toBe(false);

            const result2 = shouldSkipHighRiskCategory('Administration of Justice', 'general');
            expect(result2).toBe(false);
        });

        it('should NOT skip if intended purpose is unknown (not in map)', () => {
            const result = shouldSkipHighRiskCategory('Biometrics', 'magic_wand_app');
            expect(result).toBe(false);
        });
    });

    describe('Filtered Purposes (Empty Array)', () => {
        it('should skip ALL high-risk categories for "developer_tool"', () => {
            // developer_tool maps to [] which means it skips every category
            expect(shouldSkipHighRiskCategory('Critical Infrastructure', 'developer_tool')).toBe(true);
            expect(shouldSkipHighRiskCategory('Biometrics', 'developer_tool')).toBe(true);
            expect(shouldSkipHighRiskCategory('Employment & Worker Management', 'developer_tool')).toBe(true);
        });

        it('should skip ALL high-risk categories for "chatbot"', () => {
            expect(shouldSkipHighRiskCategory('Education & Vocational Training', 'chatbot')).toBe(true);
        });
    });

    describe('Specific Category Purposes', () => {
        it('should ALLOW matching categories and SKIP non-matching ones', () => {
            // 'hr_recruitment' only allows 'Employment & Worker Management'

            // This should NOT be skipped (allowed)
            const hrResult = shouldSkipHighRiskCategory('Employment & Worker Management', 'hr_recruitment');
            expect(hrResult).toBe(false);

            // This SHOULD be skipped (not allowed for HR)
            const infraResult = shouldSkipHighRiskCategory('Critical Infrastructure', 'hr_recruitment');
            expect(infraResult).toBe(true);
        });

        it('should handle purposes that map to multiple categories', () => {
            // 'biometrics' allows 3 different categories

            const bio1 = shouldSkipHighRiskCategory('Remote Biometric Identification', 'biometrics');
            expect(bio1).toBe(false);

            const bio2 = shouldSkipHighRiskCategory('Emotion Recognition', 'biometrics');
            expect(bio2).toBe(false);

            // Something unrelated should be skipped
            const bio3 = shouldSkipHighRiskCategory('Law Enforcement', 'biometrics');
            expect(bio3).toBe(true);
        });
    });

    describe('Map validation', () => {
        it('should contain keys for all UI options', () => {
            // Verify that the PURPOSE_CATEGORY_MAP isn't empty and has the expected format
            expect(Object.keys(PURPOSE_CATEGORY_MAP).length).toBeGreaterThan(10);
            expect(PURPOSE_CATEGORY_MAP['developer_tool']).toEqual([]);
        });
    });
});
