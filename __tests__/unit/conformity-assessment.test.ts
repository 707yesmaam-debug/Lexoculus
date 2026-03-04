import {
    determineConformityPathway,
    calculateCompletionPercent
} from '../../src/lib/compliance/eu-ai-act/conformity-assessment';

describe('Conformity Assessment Pathway', () => {

    describe('Pathway Determination', () => {
        it('should return NOT REQUIRED for MINIMAL_RISK', () => {
            const pathway = determineConformityPathway('MINIMAL_RISK', []);
            expect(pathway.applicable_module).toBe('NOT_REQUIRED');
            expect(pathway.steps.length).toBe(2);
        });

        it('should return NOT REQUIRED for LIMITED_RISK (transparency only)', () => {
            const pathway = determineConformityPathway('LIMITED_RISK', [{ article: 'Article 50' }]);
            expect(pathway.applicable_module).toBe('NOT_REQUIRED');
            // Check that notes mention transparency
            expect(pathway.notes.some(n => n.includes('transparency'))).toBe(true);
        });

        it('should return NOT REQUIRED for UNACCEPTABLE risk', () => {
            const pathway = determineConformityPathway('UNACCEPTABLE', []);
            expect(pathway.applicable_module).toBe('NOT_REQUIRED');
            expect(pathway.notes[0]).toContain('BANNED');
        });

        it('should assign MODULE A (Self-Assessment) for non-biometric HIGH_RISK', () => {
            const pathway = determineConformityPathway('HIGH_RISK', [
                { riskTier: 'HIGH_RISK', category: 'Employment', article: 'Annex III, 4(a)' }
            ]);
            expect(pathway.applicable_module).toBe('MODULE_A');
            expect(pathway.requires_notified_body).toBe(false);
            expect(pathway.self_assessment_eligible).toBe(true);
            expect(pathway.steps.length).toBeGreaterThan(0);
        });

        it('should assign MODULE B (Notified Body) for biometric HIGH_RISK', () => {
            const pathway = determineConformityPathway('HIGH_RISK', [
                { riskTier: 'HIGH_RISK', category: 'Biometrics', article: 'Annex III, 1(a)' }
            ]);
            expect(pathway.applicable_module).toBe('MODULE_B_C');
            expect(pathway.requires_notified_body).toBe(true);
            expect(pathway.self_assessment_eligible).toBe(false);

            // Check that notified body step is included
            const hasNbStep = pathway.steps.some(s => s.requires_notified_body === true);
            expect(hasNbStep).toBe(true);
        });

        it('should add GPAI notes for deployers', () => {
            const pathway = determineConformityPathway('LIMITED_RISK', [], true);
            expect(pathway.gpai_deployer).toBe(true);
            expect(pathway.notes.some(n => n.includes('GPAI'))).toBe(true);
        });
    });

    describe('Progress Tracking', () => {
        it('should calculate 0% for no completed steps', () => {
            const pathway = determineConformityPathway('HIGH_RISK', [{ article: 'Annex III, 4' }]);
            expect(calculateCompletionPercent(pathway.steps)).toBe(0);
        });

        it('should calculate correct percentage for partially completed steps', () => {
            const pathway = determineConformityPathway('HIGH_RISK', [{ article: 'Annex III, 4' }]);

            // Manually modify steps to simulate progress
            pathway.steps[0].status = 'completed';
            if (pathway.steps.length > 1) {
                pathway.steps[1].status = 'in_progress';
            }

            const pct = calculateCompletionPercent(pathway.steps);
            expect(pct).toBeGreaterThan(0);
            expect(pct).toBeLessThan(100);
        });
    });
});
