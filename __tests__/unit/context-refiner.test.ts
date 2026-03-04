import { refineWithContext } from '../../src/lib/compliance/eu-ai-act/context-refiner';
import { RiskAssessment } from '@prisma/client';

describe('Context Refiner', () => {

    const baseAssessment: RiskAssessment = {
        id: 'test',
        repo_scan_id: 'scan',
        llm_analysis_id: 'llm',
        user_id: 'user',
        risk_classification: 'HIGH_RISK',
        risk_score: 50,
        risk_narrative: null,
        intended_purpose: 'hr_recruitment',
        is_unacceptable: false,
        is_high_risk: true,
        is_limited_risk: false,
        is_minimal_risk: false,
        key_findings: [],
        assessed_at: new Date(),
        assessment_version: 1,
        manual_review_needed: false,
        manual_review_reason: null,
        tailored_questions: [],
        evidence: [],
        matched_annex_iii_articles: [{
            article: 'Annex III, 4(a)',
            category: 'Employment',
            applicable: true,
            riskTier: 'HIGH_RISK',
            requirements: ['human interface', 'data audit']
        }],
        unmatched_risk_indicators: []
    } as any as RiskAssessment;

    describe('Evidence Generation', () => {
        it('should generate human oversight evidence', () => {
            const answers = { human_oversight: 'always_review' };
            const result = refineWithContext(baseAssessment, answers);

            const oversightEvidence = result.evidence_items.find(e => e.category === 'Safety Controls');
            expect(oversightEvidence).toBeDefined();
            expect(oversightEvidence?.supports_classification).toBe('HIGH_RISK');
            expect(oversightEvidence?.confidence).toBe('HIGH');

            expect(result.context_summary.has_human_oversight).toBe(true);
        });

        it('should escalate risk if oversight is missing for high-risk system', () => {
            const answers = { autonomous_decisions: 'yes_automated', human_oversight: 'no' };
            const result = refineWithContext(baseAssessment, answers);

            // Lack of oversight doesn't change EU AI Act tier mathematically, 
            // but affects score and narrative readiness
            expect(result.compliance_readiness.overall_readiness).toBe('NEEDS_REVIEW');
            expect(result.requires_manual_review).toBe(true);
            expect(result.final_risk_score).toBeGreaterThan(baseAssessment.risk_score);

            const reqPending = result.compliance_readiness.requirements_pending;
            expect(reqPending.some(r => r.includes('oversight'))).toBe(true);
        });
    });

    describe('Risk Escalation (Context Changing Tiers)', () => {
        it('should escalate LIMITED_RISK to HIGH_RISK based on biometrics answer', () => {
            const minimalAssessment = {
                ...baseAssessment,
                risk_classification: 'LIMITED_RISK',
                is_high_risk: false,
                is_limited_risk: true,
                matched_annex_iii_articles: [{ article: 'Annex III, 6(a)' }]
            } as any as RiskAssessment;

            const answers = { law_enforcement_use: true };
            const result = refineWithContext(minimalAssessment, answers);

            expect(result.final_risk_classification).toBe('HIGH_RISK');
        });

        it('should escalate HIGH_RISK to UNACCEPTABLE based on prohibited use answers', () => {
            const bioAssessment = {
                ...baseAssessment,
                matched_annex_iii_articles: [{ article: 'Annex III, 6(a)' }]
            } as any as RiskAssessment;

            const answers = { uses_biometrics: 'realtime_id' };
            const result = refineWithContext(bioAssessment, answers);

            expect(result.final_risk_classification).toBe('UNACCEPTABLE');
            expect(result.escalation_reason).toContain('prohibited');
        });
    });

    describe('Compliance Readiness Calculation', () => {
        it('should return FULL_COMPLIANCE if all mandatory requirements are met (High Risk)', () => {
            const answers = {
                human_oversight: 'always_review',
                testing_procedure: 'comprehensive',
                transparency_statement: 'published',
                architecture_diagram: 'yes',
                human_oversight_policy: 'yes',
                data_governance_policy: 'yes',
                uses_for_hiring: 'no', // Skip the hiring deep-check for full compliance
                financial_decisions: 'no'
            };

            const minimalAssessment = {
                ...baseAssessment,
                risk_classification: 'MINIMAL_RISK', // To allow full compliance easily
                matched_annex_iii_articles: []
            } as any as RiskAssessment;

            const result = refineWithContext(minimalAssessment, answers);

            expect(result.compliance_readiness.overall_readiness).toBe('FULL_COMPLIANCE');
            expect(result.compliance_readiness.developer_action_items.length).toBe(0);
        });

        it('should correctly merge user-provided answers into matched articles as verified measures', () => {
            const empAssessment = {
                ...baseAssessment,
                matched_annex_iii_articles: [{ article: 'Article 21 (Employment)', category: 'Employment' }]
            } as any as RiskAssessment;

            const answers = { uses_for_hiring: 'screening', candidates_informed: 'yes', hiring_appeal_process: 'yes' };
            const result = refineWithContext(empAssessment, answers);

            const article = result.final_matched_articles[0];
            expect(article).toBeDefined();
            expect(article.verified).toBe(true);
            expect(article.user_confirmed_measures?.length).toBeGreaterThan(0);
        });
    });

});
