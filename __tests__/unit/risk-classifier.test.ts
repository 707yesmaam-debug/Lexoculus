import { LlmCapabilityAnalysis } from '@prisma/client';
import { classifyRiskFull } from '../../src/lib/compliance/eu-ai-act/risk-classifier';

// Mock dependencies
jest.mock('../../src/lib/compliance/eu-ai-act/constraint-engine', () => ({
    getConstraintEngine: () => ({
        matchConstraints: jest.fn().mockReturnValue({ matches: [], risk_score: 0, requires_manual_review: false, contextual_questions: [] }),
        validateLLMClassification: jest.fn().mockImplementation((classification) => ({ validated_risk: classification, was_overridden: false, matched_constraints: [], override_reason: null, audit_trail: {} }))
    })
}));

describe('Risk Classifier', () => {

    const baseAnalysis: LlmCapabilityAnalysis = {
        id: 'test-id',
        repo_scan_id: 'scan-id',
        libraries: [],
        ai_frameworks: [],
        capabilities: [],
        detected_model_types: [],
        has_training_code: false,
        has_inference_code: false,
        has_ml_pipeline: false,
        confidence_score: 0.9,
        estimated_risk_indicators: {},
        created_at: new Date(),
        updated_at: new Date()
    } as any as LlmCapabilityAnalysis;

    it('Phase 1: Provider vs. Deployer Obligation Separation - Only OpenAI API is classified as LIMITED_RISK', () => {
        const analysis: LlmCapabilityAnalysis = {
            ...baseAnalysis,
            libraries: [{ name: 'openai', source: 'package.json', category: 'generative_ai', risk_indicators: ['uses_generative_ai'] }],
            ai_frameworks: ['openai'],
            capabilities: ['gpt', 'llm', 'text generation'],
            detected_model_types: ['language model'],
            estimated_risk_indicators: { uses_generative_ai: true }
        };

        const result = classifyRiskFull(analysis);

        expect(result.risk_classification).toBe('LIMITED_RISK');
        expect(result.gpai_classification?.is_gpai_deployer).toBe(true);
        expect(result.key_findings.some(f => f.includes('[WARNING] Uses systemic risk GPAI models'))).toBe(false);

        const providerObligations = result.gpai_classification?.obligations.filter(o => o.applies_to === 'provider') || [];
        const deployerObligations = result.gpai_classification?.obligations.filter(o => o.applies_to === 'deployer') || [];

        // In our current implementation, users are deployers, so provider obligations are 0, and deployer obligations > 0
        expect(providerObligations.length).toBe(0);
        expect(deployerObligations.length).toBeGreaterThan(0);
    });

    it('Phase 2: Conditional match test - remains at LIMITED_RISK instead of escalating to HIGH_RISK', () => {
        const analysis: LlmCapabilityAnalysis = {
            ...baseAnalysis,
            capabilities: ['classification', 'decision'],
            has_ml_pipeline: true,
            has_training_code: true,
            has_inference_code: true,
            estimated_risk_indicators: {}
        };

        const result = classifyRiskFull(analysis);

        // Result should be LIMITED_RISK due to conditional downgrade in our Phase 2 changes
        expect(result.risk_classification).toBe('LIMITED_RISK');
        const employmentMatch = result.matched_annex_iii_articles.find(a => a.applicable === 'conditional');
        expect(employmentMatch).toBeDefined();
    });

    it('Phase 3: Evidence traceability test - matches link to specific dependency', () => {
        const analysis: LlmCapabilityAnalysis = {
            ...baseAnalysis,
            libraries: [
                { name: 'face_recognition', source: 'requirements.txt', risk_indicators: ['uses_biometric_processing'], category: 'biometrics' },
            ],
            estimated_risk_indicators: { uses_biometric_processing: true }
        };

        const result = classifyRiskFull(analysis);

        expect(result.evidence.length).toBeGreaterThan(0);
        expect(result.evidence[0].name).toBe('face_recognition');
        expect(result.evidence[0].risk_indicators).toContain('uses_biometric_processing');
        expect(result.evidence[0].severity).toBe('high');
    });
});
