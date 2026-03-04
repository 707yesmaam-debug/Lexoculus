import { classifyGPAI } from '../../src/lib/compliance/eu-ai-act/gpai-classifier';
import { LlmCapabilityAnalysis } from '@prisma/client';

describe('GPAI Classifier', () => {
    const baseAnalysis: LlmCapabilityAnalysis = {
        id: 'test',
        repo_scan_id: 'scan1',
        user_id: 'user1',
        is_ai_system: true,
        libraries: [],
        ai_frameworks: [],
        capabilities: [],
        detected_model_types: [],
        has_ml_pipeline: false,
        has_training_code: false,
        has_inference_code: false,
        has_data_processing: false,
        has_model_serialization: false,
        estimated_risk_indicators: {},
        llm_model_used: 'test',
        analysis_duration_ms: 100,
        confidence_score: 0.9,
        manual_review_needed: false,
        analysis_notes: null,
        analyzed_at: new Date(),
        expires_at: new Date()
    } as any as LlmCapabilityAnalysis;

    describe('Provider Detection', () => {
        it('should identify OpenAI as a systemic risk provider', () => {
            const analysis = { ...baseAnalysis, libraries: [{ name: 'openai' }] } as any as LlmCapabilityAnalysis;
            const result = classifyGPAI(analysis);

            expect(result.detected_providers.length).toBe(1);
            expect(result.detected_providers[0].provider_name).toBe('OpenAI');
            expect(result.detected_providers[0].systemic_risk).toBe(true);
            expect(result.is_systemic_risk).toBe(true);
            expect(result.is_gpai_deployer).toBe(true);
        });

        it('should identify Meta Llama as an open source provider', () => {
            const analysis = { ...baseAnalysis, libraries: [{ name: 'llama' }] } as any as LlmCapabilityAnalysis;
            const result = classifyGPAI(analysis);

            expect(result.detected_providers[0].provider_name).toBe('Meta AI');
            expect(result.open_source_exception).toBe(true);
        });

        it('should detect providers from framework names', () => {
            const analysis = { ...baseAnalysis, ai_frameworks: ['Anthropic'] } as any as LlmCapabilityAnalysis;
            const result = classifyGPAI(analysis);

            expect(result.detected_providers[0].provider_name).toBe('Anthropic');
            expect(result.is_gpai_deployer).toBe(true);
        });

        it('should detect providers from model names', () => {
            const analysis = { ...baseAnalysis, detected_model_types: ['gemini-pro'] } as any as LlmCapabilityAnalysis;
            const result = classifyGPAI(analysis);

            expect(result.detected_providers[0].provider_name).toContain('Google');
        });
    });

    describe('Orchestration Frameworks', () => {
        it('should flag GPAI usage for LangChain even without a specific provider', () => {
            const analysis = { ...baseAnalysis, ai_frameworks: ['langchain', 'chromadb'], capabilities: ['llm generating text'] } as any as LlmCapabilityAnalysis;
            const result = classifyGPAI(analysis);

            expect(result.is_gpai_deployer).toBe(true);
            expect(result.summary).toContain('deployer');
        });
    });

    describe('Obligations Generation', () => {
        it('should assign deployer obligations to deployers', () => {
            const analysis = { ...baseAnalysis, libraries: [{ name: 'openai' }] } as any as LlmCapabilityAnalysis;
            const result = classifyGPAI(analysis);

            // Check that deployer obligations exist
            const deployerObgs = result.obligations.filter(o => o.applies_to === 'deployer' || o.applies_to === 'both');
            expect(deployerObgs.length).toBeGreaterThan(0);

            // Currently, all users are considered deployers, not providers
            const strictProviderObgs = result.obligations.filter(o => o.applies_to === 'provider');
            expect(strictProviderObgs.length).toBe(0);
        });

        it('should assign systemic risk obligations if systemic risk provider is used', () => {
            const analysis = { ...baseAnalysis, ai_frameworks: ['openai'] } as any as LlmCapabilityAnalysis;
            const result = classifyGPAI(analysis);

            // Even if deployer, systemic risk flag should be passed through
            expect(result.is_systemic_risk).toBe(true);
        });
    });

    describe('Non-GPAI Systems', () => {
        it('should return false for everything if no GPAI indicators are found', () => {
            const analysis = {
                ...baseAnalysis,
                libraries: [{ name: 'scikit-learn' }],
                detected_model_types: ['random-forest']
            } as any as LlmCapabilityAnalysis;

            const result = classifyGPAI(analysis);

            expect(result.is_gpai_deployer).toBe(false);
            expect(result.is_gpai_provider).toBe(false);
            expect(result.detected_providers.length).toBe(0);
            expect(result.obligations.length).toBe(0);
        });
    });
});
