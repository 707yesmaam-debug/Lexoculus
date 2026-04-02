/**
 * Risk Classification Engine
 * 
 * Maps AI capabilities from Feature 2 to EU AI Act Annex III articles
 * and determines risk classification.
 * 
 * Enhanced with Constraint Engine validation using official EU AI Act text
 * Source: Regulation (EU) 2024/1689
 */

import { LlmCapabilityAnalysis } from '@prisma/client';
import { HIGH_RISK_ARTICLES, LIMITED_RISK_ARTICLES, UNACCEPTABLE_RISKS, EUAIConstraint, ARTICLE_5_CONSTRAINTS, ANNEX_III_CONSTRAINTS } from './annex-iii-articles';
import { getConstraintEngine, ConstraintMatchResult, LLMValidationResult } from './constraint-engine';
import { classifyGPAI, GPAIClassification } from './gpai-classifier';
import { RiskEvidence } from './risk-evidence';
import { findLibraryByName } from '../../analysis/ai-library-database';
import { shouldSkipHighRiskCategory, isDirectlyProhibitedPurpose, isArticle6_1Purpose, PURPOSE_CATEGORY_MAP } from './purpose-categories';

// Types
export type RiskClassification = 'UNACCEPTABLE' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK';

export interface RiskIndicators {
    uses_computer_vision?: boolean;
    uses_biometric_processing?: boolean;
    uses_emotion_recognition?: boolean;
    uses_critical_infrastructure?: boolean;
    uses_generative_ai?: boolean;
    uses_nlp?: boolean;
    uses_nlp_decision_making?: boolean;
    targets_vulnerable_persons?: boolean;
    high_impact_decision_making?: boolean;
}

export interface AnnexIIIMatch {
    article: string;
    category: string;
    description: string;
    applicable: boolean | 'conditional';
    riskTier: RiskClassification;
    reasoning: string;
    requirements?: string[];
}

export interface RiskAssessmentResult {
    risk_classification: RiskClassification;
    risk_score: number;
    matched_annex_iii_articles: AnnexIIIMatch[];
    unmatched_risk_indicators: string[];
    key_findings: string[];
    preliminary_assessment: {
        is_unacceptable: boolean;
        is_high_risk: boolean;
        is_limited_risk: boolean;
        is_minimal_risk: boolean;
        /** NEW: true even when UNACCEPTABLE overrides, if any Annex III articles were matched */
        also_has_high_risk_elements: boolean;
    };
    /** NEW: Structured list of reasons WHY this system is prohibited (Article 5 violations).
     *  Only populated when risk_classification === 'UNACCEPTABLE'.
     *  Separate from matched_annex_iii_articles which covers HIGH/LIMITED_RISK.
     */
    prohibition_reasons?: {
        article: string;
        category: string;
        description: string;
        official_text: string;
        exceptions_exist: boolean;
        exception_questions?: string[];
    }[];
    manual_review_needed: boolean;
    manual_review_reason?: string;
    risk_narrative: string;

    // Constraint Engine Validation (NEW)
    constraint_validation?: {
        /** Was the LLM risk overridden by constraint engine? */
        was_overridden: boolean;
        /** Reason for override if applicable */
        override_reason?: string;
        /** Matched constraint IDs from EU AI Act */
        matched_constraint_ids: string[];
        /** Official legal text citations */
        legal_citations: {
            constraint_id: string;
            regulation_source: string;
            official_text: string;
        }[];
        /** Contextual questions for user verification */
        contextual_questions: string[];
        /** Audit trail for compliance */
        audit_trail: {
            detected_libraries: string[];
            detected_patterns: string[];
            constraint_matches: string[];
        };
        // NEW: shows what the declared purpose filtered out
        purpose_filter?: {
            declared_purpose: string;
            categories_evaluated: string[] | 'ALL';
            categories_skipped: string[];
            note: string;
        } | null;
    };

    // GPAI Classification (Chapter V, Articles 51-55)
    gpai_classification?: GPAIClassification;

    // Evidence Traceability (Phase 3)
    evidence: RiskEvidence[];
}

/**
 * Base risk classification — DO NOT CALL DIRECTLY in production paths.
 * 
 * @internal
 * @deprecated Use `classifyRiskFull()` which includes all 8 Article 5 prohibition
 * checks via the Constraint Engine. This function only detects
 * `targets_vulnerable_persons` (art5_1b) from UNACCEPTABLE risk; the other
 * 7 prohibitions (subliminal manipulation, social scoring, real-time biometric
 * ID, etc.) require the Constraint Engine wrapper.
 * 
 * Safe call chains:
 *   classifyRiskFull()
 *     → classifyRiskWithConstraintValidation()
 *       → classifyRisk()   ← here
 */
export function classifyRisk(analysis: LlmCapabilityAnalysis, intendedPurpose?: string): RiskAssessmentResult {
    const matchedArticles: AnnexIIIMatch[] = [];
    const keyFindings: string[] = [];
    const unmatchedIndicators: string[] = [];
    let riskClassification: RiskClassification = 'MINIMAL_RISK';
    let manualReviewReason: string | undefined;

    // Parse risk indicators from JSON with safe defaults
    const indicators = (analysis.estimated_risk_indicators || {}) as RiskIndicators;
    const capabilities = (analysis.capabilities || []) as string[];
    const detectedModelTypes = (analysis.detected_model_types || []) as string[];

    // We expect these to be populated from dependency-scanner or LLM.
    // The LLM returns plain strings (e.g. ["openai", "anthropic"]),
    // so we normalize them into objects and enrich with AI Library DB metadata.
    type LibraryData = { name?: string; matched_string?: string; source?: string; version?: string; risk_indicators?: string[]; category?: string; };
    const rawLibInput = (analysis.libraries || []) as (string | LibraryData)[];
    const rawLibraries: LibraryData[] = rawLibInput.map(item => {
        if (typeof item === 'string') {
            // Look up in the AI Library Database for rich metadata
            const dbEntry = findLibraryByName(item);
            return {
                name: item,
                matched_string: item,
                source: 'LLM detection',
                risk_indicators: dbEntry?.risk_indicators || [],
                category: dbEntry?.category || 'unknown',
            };
        }
        return item;
    });
    const evidenceList: RiskEvidence[] = [];

    // ========================================
    // STEP 0: Check directly prohibited purpose (Bug #3 fix)
    // If the user declared a purpose that maps directly to Article 5
    // (e.g., social_scoring, real_time_biometric_id), escalate immediately
    // without relying solely on pattern matching.
    // ========================================

    if (isDirectlyProhibitedPurpose(intendedPurpose)) {
        const purposeArticleMap: Record<string, string> = {
            'social_scoring': 'Article 5(1)(c)',
            'real_time_biometric_id': 'Article 5(1)(h)',
        };
        const article = purposeArticleMap[intendedPurpose!] || 'Article 5';
        const categoryMap: Record<string, string> = {
            'social_scoring': 'Social Scoring',
            'real_time_biometric_id': 'Real-time Public Biometric ID (Law Enforcement)',
        };
        const descMap: Record<string, string> = {
            'social_scoring': 'Your declared purpose "Social Credit / Citizen Scoring" is explicitly prohibited under Article 5(1)(c). Systems that evaluate natural persons over time based on social behaviour to produce a score that leads to detrimental treatment cannot be placed on the EU market or used in the EU.',
            'real_time_biometric_id': 'Your declared purpose "Real-Time Biometric Identification in Public" is prohibited under Article 5(1)(h). Live remote biometric identification in publicly accessible spaces is banned except for three narrow law enforcement exceptions requiring prior judicial authorisation.',
        };
        matchedArticles.push({
            article,
            category: categoryMap[intendedPurpose!] || 'Prohibited Practice',
            description: descMap[intendedPurpose!] || `Declared purpose is prohibited under ${article} of Regulation (EU) 2024/1689`,
            applicable: true,
            riskTier: 'UNACCEPTABLE',
            reasoning: `User explicitly declared the system\'s purpose as "${intendedPurpose}", which is a prohibited practice under ${article}. The UNACCEPTABLE classification is purpose-triggered, not inferred from code patterns.`,
        });
        riskClassification = 'UNACCEPTABLE';
        keyFindings.push(`PROHIBITED (${article}): Declared purpose is a banned AI practice. This system cannot be deployed in the EU. See Article 5 of Regulation (EU) 2024/1689 for narrow exceptions.`);
        manualReviewReason = `UNACCEPTABLE risk — declared purpose falls under ${article} prohibition. Legal counsel required before any deployment.`;
    }

    // ========================================
    // STEP 0.5: Check Article 6(1) path — Annex I product safety components
    // These get HIGH_RISK immediately and require Notified Body (Module B+C)
    // ========================================

    if (isArticle6_1Purpose(intendedPurpose)) {
        const article61Desc: Record<string, string> = {
            'medical_device': 'Your system is declared as a Medical Device AI safety component, regulated under Article 6(1) of the EU AI Act in conjunction with Medical Devices Regulation (MDR 2017/745). This requires a Module B+C conformity assessment through an EU Notified Body — self-assessment (Module A) is NOT sufficient.',
            'machinery_safety': 'Your system is a safety component in machinery regulated under the EU Machinery Regulation (2023/1230). Article 6(1) of the EU AI Act classifies this as HIGH RISK requiring conformity assessment.',
            'autonomous_vehicles': 'Your system is a safety component in an autonomous or assisted-driving vehicle, regulated under Article 6(1) and EU type-approval legislation. This is HIGH RISK under the EU AI Act.',
            'civil_aviation': 'Your system is an AI safety component in civil aviation, regulated by EASA under Article 6(1) of the EU AI Act. This is HIGH RISK and requires conformity assessment through an EU Notified Body.',
        };
        const desc = article61Desc[intendedPurpose!] || `Declared as an Article 6(1) product safety component — HIGH RISK classification applies. Module B+C conformity assessment required.`;
        matchedArticles.push({
            article: 'Article 6(1)',
            category: `Article 6(1) — ${intendedPurpose || 'Product Safety'}`,
            description: desc,
            applicable: true,
            riskTier: 'HIGH_RISK',
            reasoning: `System is a safety component of a product regulated by EU harmonisation legislation (Annex I of the AI Act). Article 6(1) mandates HIGH RISK classification with third-party conformity assessment.`,
            requirements: [
                'Module B+C EU-Type Examination via Notified Body',
                'Technical documentation per Annex IV',
                'Quality Management System',
                'Post-market surveillance plan',
                'EU Declaration of Conformity',
                'EU database registration (Article 49)',
            ],
        });
        if (riskClassification !== 'UNACCEPTABLE') {
            riskClassification = 'HIGH_RISK';
        }
        keyFindings.push(`HIGH RISK (Article 6(1)): System is a safety component of a product covered by EU harmonisation legislation. ${intendedPurpose === 'medical_device' ? 'MDR 2017/745 applies. ' : ''}Self-assessment is NOT sufficient — a Notified Body must conduct the conformity assessment.`);
    }

    // ========================================
    // STEP 1: Check UNACCEPTABLE RISK
    // ========================================

    if (indicators.targets_vulnerable_persons) {
        matchedArticles.push({
            article: 'Article 5(1)(b)',
            category: 'Exploitation of Vulnerabilities',
            description: 'The system appears to target individuals based on age, disability, or socio-economic status to materially distort their behaviour in a harmful way. This is prohibited under Article 5(1)(b) of Regulation (EU) 2024/1689.',
            applicable: true,
            riskTier: 'UNACCEPTABLE',
            reasoning: 'Risk indicator `targets_vulnerable_persons` detected. This signals the system may exploit the vulnerabilities of persons due to age, disability, or social/economic situation, causing or risking significant harm.',
        });
        riskClassification = 'UNACCEPTABLE';
        keyFindings.push('PROHIBITED (Article 5(1)(b)): System detected as targeting vulnerable persons (children, elderly, disabled, or low-income groups) to influence their behaviour. This is banned under Article 5(1)(b). Remove this capability or verify it does not exploit vulnerabilities.');
        manualReviewReason = 'UNACCEPTABLE risk (Article 5(1)(b)) — exploitation of vulnerable persons. Mandatory legal review before any deployment.';
    }

    // STEP 1B: Check Article 5(1)(f) — Workplace / Education Emotion Recognition
    // This is UNACCEPTABLE regardless of biometric processing
    if (indicators.uses_emotion_recognition) {
        const workplaceContextKeywords = ['workplace', 'employee', 'worker', 'student', 'education', 'school', 'classroom'];
        const hasWorkplaceContext = workplaceContextKeywords.some(kw =>
            (intendedPurpose || '').toLowerCase().includes(kw) ||
            (analysis.analysis_notes || '').toLowerCase().includes(kw)
        );

        // Bug #7 fix: also cover new granular purpose keys
        const isWorkplacePurpose = hasWorkplaceContext ||
            intendedPurpose === 'worker_monitoring' ||
            intendedPurpose === 'worker_management' ||
            intendedPurpose === 'education' ||
            intendedPurpose === 'education_access' ||
            intendedPurpose === 'student_assessment' ||
            intendedPurpose === 'student_placement' ||
            intendedPurpose === 'student_monitoring';

        if (isWorkplacePurpose) {
            const detectedEmotionLibs = rawLibraries
                .filter(l => l.risk_indicators?.includes('uses_emotion_recognition') || l.category === 'biometrics')
                .map(l => l.name || l.matched_string || 'unknown')
                .filter(Boolean);
            const libList = detectedEmotionLibs.length > 0 ? ` Detected libraries: ${detectedEmotionLibs.join(', ')}.` : '';
            matchedArticles.push({
                article: 'Article 5(1)(f)',
                category: 'Workplace/Education Emotion Recognition',
                description: `Emotion recognition systems in workplace or education settings are PROHIBITED under Article 5(1)(f) of Regulation (EU) 2024/1689, except where used strictly for medical or safety reasons.${libList} To fix this: remove emotion recognition capabilities from your workplace/education deployment, or provide evidence that it is used solely for medical/safety purposes (e.g., driver drowsiness detection, pain assessment).`,
                applicable: true,
                riskTier: 'UNACCEPTABLE',
                reasoning: `Emotion recognition capability detected (${indicators.uses_emotion_recognition ? 'risk indicator set' : 'code pattern match'}) in a workplace or education context (purpose: ${intendedPurpose || 'inferred from context'}).${libList}`,
            });
            riskClassification = 'UNACCEPTABLE';
            keyFindings.push(`PROHIBITED (Article 5(1)(f)): Emotion recognition in ${intendedPurpose?.startsWith('student') || intendedPurpose?.startsWith('education') ? 'educational' : 'workplace'} context.${libList} This is banned under Article 5(1)(f) unless strictly for medical/safety purposes. Developers must remove this capability or restrict deployment to non-workplace/non-education contexts.`);
            manualReviewReason = 'UNACCEPTABLE risk (Article 5(1)(f)) — emotion recognition deployed in workplace or education. Legal review required.';
        }
    }

    // ========================================
    // STEP 2: Check HIGH RISK (Articles 6-27)
    // ========================================

    // Annex III(1)(a): Biometric Identification & Categorization
    if (indicators.uses_biometric_processing && !shouldSkipHighRiskCategory('Remote Biometric Identification', intendedPurpose)) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Annex III(1)(a)') ||
            HIGH_RISK_ARTICLES.find(a => a.article === 'Article 6-9');

        const relatedLibs = rawLibraries.filter(l => l.risk_indicators?.includes('uses_biometric_processing') ||
            l.category === 'biometrics');
        const libNames = relatedLibs.map(l => l.name || l.matched_string || 'unknown').filter(Boolean);
        const libList = libNames.length > 0 ? ` Triggered by: ${libNames.join(', ')}.` : '';

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: `Biometric processing detected — this system identifies or categorizes natural persons from biometric data, which is HIGH RISK under Annex III(1)(a) of the EU AI Act.${libList} Developers must conduct a conformity assessment, register in the EU AI database, implement human oversight for all identification decisions, and maintain logs of all operations. Note: biometric VERIFICATION (1:1 matching for a known person) is exempt — if your system only verifies claimed identity, document this to qualify for the exception.`,
                applicable: true,
                riskTier: 'HIGH_RISK',
                reasoning: `Biometric processing risk indicator detected.${libList} Annex III(1)(a) covers remote biometric identification systems.`,
                requirements: article.requirements,
            });
            if (riskClassification !== 'UNACCEPTABLE') {
                riskClassification = 'HIGH_RISK';
            }
            keyFindings.push(`HIGH RISK (Annex III(1)(a)): Remote biometric identification detected.${libList} Required actions: (1) conduct conformity assessment, (2) register in EU AI database, (3) implement human oversight. Exception: if this is 1:1 identity VERIFICATION only (not 1:N search), document this to qualify for the Annex III(1)(a) exemption.`);

            relatedLibs.forEach(lib => {
                evidenceList.push({
                    type: 'dependency',
                    name: lib.name || lib.matched_string || 'unknown',
                    source_file: lib.source || 'unknown',
                    version: lib.version,
                    risk_indicators: ['uses_biometric_processing'],
                    triggered_articles: [article.article],
                    severity: 'high',
                });
            });
        }
    }

    // Annex III(1)(c): Emotion Recognition (outside workplace/education — those are UNACCEPTABLE above)
    if (indicators.uses_emotion_recognition && !shouldSkipHighRiskCategory('Emotion Recognition', intendedPurpose)) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Annex III(1)(c)') ||
            HIGH_RISK_ARTICLES.find(a => a.article === 'Article 6-9');

        const relatedLibs = rawLibraries.filter(l => l.risk_indicators?.includes('uses_emotion_recognition') || l.category === 'biometrics');
        const libNames = relatedLibs.map(l => l.name || l.matched_string || 'unknown').filter(Boolean);
        const libList = libNames.length > 0 ? ` Triggered by: ${libNames.join(', ')}.` : '';

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: 'Emotion Recognition',
                description: `Emotion recognition system detected — classified as HIGH RISK under Annex III(1)(c).${libList} This applies to ALL emotion recognition systems not already prohibited under Article 5(1)(f) (workplace/education). Developers must: (1) inform users that emotions are being detected, (2) implement human oversight, (3) provide users a right to object. Note: if this is used ONLY for medical or safety purposes (e.g., driver drowsiness), document this specifically for the Article 5(1)(f) exception.`,
                applicable: true,
                riskTier: 'HIGH_RISK',
                reasoning: `Emotion recognition risk indicator set.${libList}`,
                requirements: article.requirements,
            });
            if (riskClassification !== 'UNACCEPTABLE') {
                riskClassification = 'HIGH_RISK';
            }
            keyFindings.push(`HIGH RISK (Annex III(1)(c)): Emotion recognition detected.${libList} Actions required: (1) inform users emotions are detected, (2) provide right to object, (3) implement human oversight. If deployed in workplace/education: reclassify as UNACCEPTABLE (Article 5(1)(f)).`);
            relatedLibs.forEach(lib => {
                evidenceList.push({
                    type: 'dependency',
                    name: lib.name || lib.matched_string || 'unknown',
                    source_file: lib.source || 'unknown',
                    version: lib.version,
                    risk_indicators: ['uses_emotion_recognition'],
                    triggered_articles: [article.article],
                    severity: 'high',
                });
            });
        }
    }

    // Annex III(2): Critical Infrastructure
    if (indicators.uses_critical_infrastructure && !shouldSkipHighRiskCategory('Critical Infrastructure', intendedPurpose)) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Annex III(2)') ||
            HIGH_RISK_ARTICLES.find(a => a.article === 'Article 15');

        const relatedLibs = rawLibraries.filter(l => l.risk_indicators?.includes('uses_critical_infrastructure'));
        const libNames = relatedLibs.map(l => l.name || l.matched_string || 'unknown').filter(Boolean);
        const libList = libNames.length > 0 ? ` Triggered by: ${libNames.join(', ')}.` : '';

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: `Critical infrastructure involvement detected — HIGH RISK under Annex III(2).${libList} The EU AI Act classifies AI systems as safety components in the management of road traffic, water, gas, heating, electricity, or critical digital infrastructure as HIGH RISK. Developers must implement a full risk management system, quality management system, technical documentation, and post-market monitoring. Ensure the system cannot cause infrastructure disruption without human approval.`,
                applicable: true,
                riskTier: 'HIGH_RISK',
                reasoning: `Critical infrastructure risk indicator detected.${libList}`,
                requirements: article.requirements,
            });
            if (riskClassification !== 'UNACCEPTABLE') {
                riskClassification = 'HIGH_RISK';
            }
            keyFindings.push(`HIGH RISK (Annex III(2)): Critical infrastructure safety component detected.${libList} Actions required: (1) implement risk management system, (2) prepare technical documentation, (3) register in EU AI database, (4) implement human override capability for all safety-critical decisions.`);
            relatedLibs.forEach(lib => {
                evidenceList.push({
                    type: 'dependency',
                    name: lib.name || lib.matched_string || 'unknown',
                    source_file: lib.source || 'unknown',
                    version: lib.version,
                    risk_indicators: ['uses_critical_infrastructure'],
                    triggered_articles: [article.article],
                    severity: 'high',
                });
            });
        }
    }

    // Annex III(4): Employment Decisions (conditional — requires context verification)
    const hasClassificationCapability = capabilities.some(c =>
        c.toLowerCase().includes('classification') ||
        c.toLowerCase().includes('decision') ||
        c.toLowerCase().includes('scoring') ||
        c.toLowerCase().includes('ranking')
    );

    if (analysis.has_ml_pipeline &&
        analysis.has_training_code &&
        analysis.has_inference_code &&
        hasClassificationCapability &&
        !shouldSkipHighRiskCategory('Employment & Worker Management', intendedPurpose)) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Annex III(4)') ||
            HIGH_RISK_ARTICLES.find(a => a.article === 'Article 21');

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: `Classification/decision-making capability detected in an employment context — conditionally HIGH RISK under Annex III(4). If this system is used for recruitment, candidate selection, promotion, termination, pay decisions, or worker monitoring, it is HIGH RISK under EU AI Act Annex III(4). Developers must: (1) inform all affected workers/candidates that AI is involved, (2) provide a right to explanation for all decisions, (3) ensure a human can review and override every decision, (4) conduct bias and discrimination testing before deployment.`,
                applicable: 'conditional',
                riskTier: 'HIGH_RISK',
                reasoning: `System has ML pipeline + training + inference + classification capability. If deployed in employment context, Annex III(4) applies. Annex III categories present: ${intendedPurpose ? '`' + intendedPurpose + '`' : 'unspecified — use context questions to confirm'}.`,
                requirements: article.requirements,
            });
            if (riskClassification === 'MINIMAL_RISK') {
                riskClassification = 'LIMITED_RISK';
            }
            keyFindings.push('CONDITIONAL HIGH RISK (Annex III(4)): ML pipeline with classification/scoring detected. If used for recruitment, promotion, termination, task allocation, or worker monitoring → HIGH RISK applies. Verify intended use in the context verification step. Actions needed: candidate/worker transparency, right to explanation, human override.');
            unmatchedIndicators.push('employment_decision_capability');
        }
    }

    // Annex III(5): Essential Services (conditional — requires context verification)
    const hasFinancialCapability = capabilities.some(c => {
        const lower = c.toLowerCase();
        return lower.includes('credit_scoring') ||
            lower.includes('credit scoring') ||
            lower.includes('loan_decision') ||
            lower.includes('loan decision') ||
            lower.includes('insurance_underwriting') ||
            lower.includes('insurance underwriting') ||
            lower.includes('benefit_eligibility') ||
            lower.includes('benefit eligibility') ||
            lower.includes('mortgage') ||
            lower.includes('welfare_assessment') ||
            lower.includes('emergency_dispatch') ||
            lower.includes('triage') ||
            lower.includes('emergency_classification');
    });

    if (hasFinancialCapability && analysis.has_ml_pipeline && !shouldSkipHighRiskCategory('Essential Services Access', intendedPurpose)) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Annex III(5)') ||
            HIGH_RISK_ARTICLES.find(a => a.article === 'Article 22');

        const isEmergency = capabilities.some(c => c.toLowerCase().includes('emergency') || c.toLowerCase().includes('triage') || c.toLowerCase().includes('dispatch'));

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: `Essential services capability detected — conditionally HIGH RISK under Annex III(5). ${isEmergency ? 'Emergency dispatch/triage capability detected: Annex III(5)(d) applies if this system classifies emergency calls or prioritizes first responders. Operators must retain full human control over dispatch decisions.' : 'Credit/insurance/benefits capability detected: if this system evaluates eligibility for credit, public benefits, or sets insurance premiums, Annex III(5) applies.'} Required actions: (1) inform affected individuals that AI is involved, (2) provide a right to explanation, (3) ensure humans can review and override every outcome, (4) conduct non-discrimination testing.`,
                applicable: 'conditional',
                riskTier: 'HIGH_RISK',
                reasoning: `ML pipeline with financial/essential-services capability detected. Context verification needed to confirm Annex III(5) applicability.`,
                requirements: article.requirements,
            });
            if (riskClassification === 'MINIMAL_RISK') {
                riskClassification = 'LIMITED_RISK';
            }
            keyFindings.push(`CONDITIONAL HIGH RISK (Annex III(5)): ${isEmergency ? 'Emergency dispatch/triage capability detected — if classifying calls or triaging patients, this is HIGH RISK under Annex III(5)(d).' : 'Credit scoring / benefits / insurance capability detected — HIGH RISK if used for eligibility decisions.'} Verify in context questions. Required: individual transparency, right to explanation, human override, discrimination testing.`);
            unmatchedIndicators.push('financial_decision_capability');
        }
    }

    // Article 26: Autonomous Vehicles
    const hasAutonomousCapability =
        indicators.uses_computer_vision &&
        capabilities.some(c =>
            c.toLowerCase().includes('autonomous') ||
            c.toLowerCase().includes('navigation') ||
            c.toLowerCase().includes('object detection') ||
            c.toLowerCase().includes('lane detection')
        ) &&
        detectedModelTypes.some(t =>
            t.toLowerCase().includes('object detection') ||
            t.toLowerCase().includes('segmentation')
        );

    if (hasAutonomousCapability && !shouldSkipHighRiskCategory('Autonomous Vehicles', intendedPurpose)) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Article 26')!;
        matchedArticles.push({
            article: article.article,
            category: article.category,
            description: article.description,
            applicable: true,
            riskTier: 'HIGH_RISK',
            reasoning: 'Autonomous vehicle components detected - computer vision with navigation capabilities',
            requirements: article.requirements,
        });
        if (riskClassification !== 'UNACCEPTABLE') {
            riskClassification = 'HIGH_RISK';
        }
        keyFindings.push('Autonomous vehicle system detected - HIGH RISK');

        const relatedLibs = rawLibraries.filter(l => l.risk_indicators?.includes('uses_computer_vision') ||
            l.category === 'computer_vision');
        relatedLibs.forEach(lib => {
            evidenceList.push({
                type: 'dependency',
                name: lib.name || lib.matched_string || 'unknown',
                source_file: lib.source || 'unknown',
                version: lib.version,
                risk_indicators: ['uses_computer_vision'],
                triggered_articles: [article.article],
                severity: 'high',
            });
        });
    }

    // ========================================
    // STEP 3: Check LIMITED RISK (Articles 37-40)
    // ========================================

    // Article 50(3): Emotion Recognition Transparency (Applies globally when Emotion Recognition is used)
    if (indicators.uses_emotion_recognition) {
        const article = LIMITED_RISK_ARTICLES.find(a => a.article === 'Article 50(3)') ||
            LIMITED_RISK_ARTICLES.find(a => a.article === 'Article 37');

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: article.description,
                applicable: true,
                riskTier: 'LIMITED_RISK',
                reasoning: 'Emotion recognition systems are subject to transparency obligations (Article 50(3)), requiring users to be informed of the system\'s operation.',
                requirements: article.requirements,
            });
            // This is additive, do not downgrade if already UNACCEPTABLE or HIGH_RISK
            if (riskClassification === 'MINIMAL_RISK') {
                riskClassification = 'LIMITED_RISK';
            }
            keyFindings.push('Emotion recognition transparency obligation (Article 50(3)) applies');
        }
    }

    // Article 50(2): Code/Content Generation (Generative AI — transparency obligation)
    const isGenerativeSystem =
        indicators.uses_generative_ai &&
        detectedModelTypes.some(t =>
            t.toLowerCase().includes('transformer') ||
            t.toLowerCase().includes('language model') ||
            t.toLowerCase().includes('gpt') ||
            t.toLowerCase().includes('llm')
        ) &&
        capabilities.some(c =>
            c.toLowerCase().includes('code') ||
            c.toLowerCase().includes('text') ||
            c.toLowerCase().includes('generation') ||
            c.toLowerCase().includes('synthesis') ||
            c.toLowerCase().includes('generative')
        );

    if (isGenerativeSystem) {
        const article = LIMITED_RISK_ARTICLES.find(a => a.article === 'Article 50(2)') ||
            LIMITED_RISK_ARTICLES.find(a => a.article === 'Article 39');

        const relatedLibs = rawLibraries.filter(l => l.risk_indicators?.includes('uses_generative_ai') || l.category === 'generative_ai');
        const libNames = relatedLibs.map(l => l.name || l.matched_string || 'unknown').filter(Boolean);
        const libList = libNames.length > 0 ? ` Detected: ${libNames.join(', ')}.` : '';

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: `Generative AI system detected — LIMITED RISK under Article 50(2) of Regulation (EU) 2024/1689.${libList} Providers must mark all AI-generated outputs (text, code, images, audio, video) in a machine-readable format that makes them detectable as artificially generated. Obligation applies from 2 August 2026. Practical steps: (1) embed C2PA-compatible provenance metadata or watermarks, (2) display clear in-UI labels on all AI-generated content, (3) do not allow outputs to be presented as human-authored without disclosure.`,
                applicable: true,
                riskTier: 'LIMITED_RISK',
                reasoning: `Generative AI detected: generative_ai indicator + ${detectedModelTypes.slice(0,3).join(', ')} model types + generative capabilities.${libList}`,
                requirements: article.requirements,
            });
            if (riskClassification === 'MINIMAL_RISK') {
                riskClassification = 'LIMITED_RISK';
            }
            keyFindings.push(`LIMITED RISK (Article 50(2)): Generative AI detected.${libList} Required by 2 August 2026: (1) mark all AI-generated outputs in machine-readable format, (2) display UI disclosures on generated content, (3) do not present outputs as human-authored. Article 50 transparency obligations apply immediately.`);
            relatedLibs.forEach(lib => {
                evidenceList.push({
                    type: 'dependency',
                    name: lib.name || lib.matched_string || 'unknown',
                    source_file: lib.source || 'unknown',
                    version: lib.version,
                    risk_indicators: ['uses_generative_ai'],
                    triggered_articles: [article.article],
                    severity: 'medium',
                });
            });
        }
    }

    // Article 40: Personalized Recommendations
    const isRecommendationSystem = capabilities.some(c =>
        c.toLowerCase().includes('recommendation') ||
        c.toLowerCase().includes('personalization') ||
        c.toLowerCase().includes('content curation') ||
        c.toLowerCase().includes('ranking')
    ) && analysis.has_ml_pipeline;

    if (isRecommendationSystem && !hasFinancialCapability) {
        // Only add if not already flagged for financial decisions
        const article = LIMITED_RISK_ARTICLES.find(a => a.article === 'Article 40');

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: article.description,
                applicable: true,
                riskTier: 'LIMITED_RISK',
                reasoning: 'Personalized recommendation system with ML pipeline',
                requirements: article.requirements,
            });
            if (riskClassification === 'MINIMAL_RISK') {
                riskClassification = 'LIMITED_RISK';
            }
            keyFindings.push('Recommendation system - LIMITED RISK (requires transparency)');
            // For recommendation systems, any data processing / ML ops might be evidence
            const relatedLibs = rawLibraries.filter(l => l.category === 'data_processing' || l.category === 'mlops');
            relatedLibs.forEach(lib => {
                evidenceList.push({
                    type: 'dependency',
                    name: lib.name || lib.matched_string || 'unknown',
                    source_file: lib.source || 'unknown',
                    version: lib.version,
                    risk_indicators: [],
                    triggered_articles: [article.article],
                    severity: 'medium',
                });
            });
        }
    }

    // ========================================
    // STEP 4: Handle NLP Systems
    // ========================================

    if (indicators.uses_nlp && !isGenerativeSystem) {
        // NLP without generative AI is generally lower risk
        if (indicators.uses_nlp_decision_making) {
            unmatchedIndicators.push('nlp_decision_making');
            keyFindings.push('NLP used for decision-making - verify context in Feature 4');
        } else {
            keyFindings.push('NLP capabilities detected - no specific regulatory category matched');
        }
    }

    // ========================================
    // STEP 5: Handle Computer Vision (not biometric)
    // ========================================

    if (indicators.uses_computer_vision && !indicators.uses_biometric_processing && !hasAutonomousCapability) {
        // General computer vision without biometrics
        keyFindings.push('Computer vision detected - no biometric processing identified');
    }

    // ========================================
    // STEP 6: Handle High-Impact Decision Making
    // ========================================

    if (indicators.high_impact_decision_making &&
        !matchedArticles.some(a => a.riskTier === 'HIGH_RISK' && a.applicable === true)) {
        unmatchedIndicators.push('high_impact_decision_making');
        keyFindings.push('High-impact decision capabilities detected - requires context verification');
    }

    // ========================================
    // STEP 6.5: Catch-all Evidence for Detected Libraries
    // ========================================
    // Ensure every detected AI library appears in the Evidence Trail,
    // even if no specific Annex III article was matched (e.g. Constraint Engine escalation).
    const alreadyEvidenced = new Set(evidenceList.map(e => e.name));
    rawLibraries.forEach(lib => {
        const libName = lib.name || lib.matched_string || '';
        if (libName && !alreadyEvidenced.has(libName)) {
            const libRiskIndicators = (lib.risk_indicators || []) as string[];
            // Determine severity based on risk indicators
            let severity: 'info' | 'medium' | 'high' | 'critical' = 'info';
            if (libRiskIndicators.some(r => r.includes('biometric') || r.includes('critical'))) {
                severity = 'high';
            } else if (libRiskIndicators.some(r => r.includes('generative') || r.includes('nlp') || r.includes('decision'))) {
                severity = 'medium';
            } else if (libRiskIndicators.length > 0) {
                severity = 'medium';
            }

            evidenceList.push({
                type: 'dependency',
                name: libName,
                source_file: lib.source || 'unknown',
                version: lib.version,
                risk_indicators: libRiskIndicators,
                triggered_articles: [],
                severity,
            });
        }
    });

    // ========================================
    // STEP 7: Default to MINIMAL_RISK if no matches
    // ========================================

    if (matchedArticles.length === 0) {
        keyFindings.push('No specific Annex III articles matched - classified as MINIMAL RISK');
    }

    // ========================================
    // STEP 8: Calculate Risk Score
    // ========================================

    const riskScore = calculateRiskScore(
        riskClassification,
        analysis,
        matchedArticles
    );

    // ========================================
    // STEP 9: Determine Manual Review Need
    // ========================================

    const manualReviewNeeded =
        riskClassification === 'UNACCEPTABLE' ||
        (riskClassification === 'HIGH_RISK' && matchedArticles.filter(a => a.applicable === true).length >= 2) ||
        unmatchedIndicators.length > 0 ||
        analysis.confidence_score < 0.7 ||
        matchedArticles.some(a => a.applicable === 'conditional');

    if (!manualReviewReason) {
        if (analysis.confidence_score < 0.7) {
            manualReviewReason = 'Low confidence score - recommend human verification';
        } else if (unmatchedIndicators.length > 0) {
            manualReviewReason = 'Unmatched risk indicators require context verification';
        } else if (matchedArticles.some(a => a.applicable === 'conditional')) {
            manualReviewReason = 'Conditional risk assessment - use case verification needed';
        }
    }

    // ========================================
    // STEP 10: Generate Risk Narrative
    // ========================================

    const riskNarrative = generateRiskNarrative(
        riskClassification,
        matchedArticles,
        analysis.confidence_score
    );

    return {
        risk_classification: riskClassification,
        risk_score: riskScore,
        matched_annex_iii_articles: matchedArticles,
        unmatched_risk_indicators: unmatchedIndicators,
        key_findings: keyFindings,
        preliminary_assessment: {
            is_unacceptable: riskClassification === 'UNACCEPTABLE',
            is_high_risk: riskClassification === 'HIGH_RISK',
            is_limited_risk: riskClassification === 'LIMITED_RISK',
            is_minimal_risk: riskClassification === 'MINIMAL_RISK',
            also_has_high_risk_elements: matchedArticles.some(a => a.riskTier === 'HIGH_RISK' && a.applicable === true),
        },
        manual_review_needed: manualReviewNeeded,
        manual_review_reason: manualReviewReason,
        risk_narrative: riskNarrative,
        evidence: evidenceList,
    };
}

/**
 * Calculate risk score based on classification and analysis
 */
function calculateRiskScore(
    classification: RiskClassification,
    analysis: LlmCapabilityAnalysis,
    matchedArticles: AnnexIIIMatch[]
): number {
    let score = 0;

    // Base score by classification
    switch (classification) {
        case 'UNACCEPTABLE':
            score = 100;
            break;
        case 'HIGH_RISK':
            score = 75;
            break;
        case 'LIMITED_RISK':
            score = 45;
            break;
        case 'MINIMAL_RISK':
            score = 15;
            break;
    }

    // Adjust for matched articles
    const confirmedHighRisk = matchedArticles.filter(a =>
        a.riskTier === 'HIGH_RISK' && a.applicable === true
    ).length;
    score += Math.min(confirmedHighRisk * 3, 10);

    // Conditional high risk should not add penalty points until confirmed
    // const conditionalHighRisk = matchedArticles.filter(a =>
    //     a.riskTier === 'HIGH_RISK' && a.applicable === 'conditional'
    // ).length;
    // score += Math.min(conditionalHighRisk * 1, 5);

    // Adjust for code structure
    if (analysis.has_ml_pipeline) score += 3;
    if (analysis.has_training_code) score += 2;
    if (!analysis.has_inference_code) score -= 10; // Training-only is lower risk

    // Adjust for confidence
    if (analysis.confidence_score < 0.7) {
        score -= 10;
    } else if (analysis.confidence_score > 0.9) {
        score += 5;
    }

    // Ensure bounds
    return Math.min(100, Math.max(0, score));
}

/**
 * Generate human-readable risk narrative
 */
function generateRiskNarrative(
    classification: RiskClassification,
    matchedArticles: AnnexIIIMatch[],
    confidenceScore: number
): string {
    const narratives: string[] = [];

    const articleNames = matchedArticles.map(a => a.article).join(' and ');
    const requirements = matchedArticles.flatMap(a => a.requirements || []);
    const uniqueReqs = [...new Set(requirements)];

    switch (classification) {
        case 'UNACCEPTABLE':
            narratives.push('This AI system has been classified as UNACCEPTABLE under the EU AI Act.');
            if (matchedArticles.length > 0) {
                narratives.push(`It matched prohibited categories: ${articleNames}.`);
            }
            narratives.push('Systems in this category are prohibited and cannot be deployed in the European Union.');
            break;
        case 'HIGH_RISK':
            if (matchedArticles.length > 0) {
                narratives.push(`This system is classified HIGH RISK under EU AI Act Annex III.`);
                narratives.push(`It matched ${matchedArticles.length} Annex III article(s): ${articleNames}.`);
                if (uniqueReqs.length > 0) {
                    narratives.push(`Mandatory obligations include: ${uniqueReqs.slice(0, 3).join(', ')}${uniqueReqs.length > 3 ? ', and more' : ''}.`);
                }
            } else {
                narratives.push('This AI system has been classified as HIGH RISK under the EU AI Act Annex III.');
                narratives.push('High-risk systems require extensive compliance documentation, conformity assessment, and ongoing monitoring.');
            }
            break;
        case 'LIMITED_RISK':
            narratives.push('This AI system has been classified as LIMITED RISK under the EU AI Act.');
            narratives.push('Limited-risk systems require transparency measures and user awareness disclosures.');
            break;
        case 'MINIMAL_RISK':
            narratives.push('This AI system has been classified as MINIMAL RISK under the EU AI Act.');
            narratives.push('Minimal-risk systems are generally exempt from specific regulatory requirements but should follow best practices.');
            break;
    }

    if (confidenceScore < 0.7) {
        narratives.push('Note: Analysis confidence is below 70% - manual verification recommended.');
    }

    return narratives.join(' ');
}

// =============================================================================
// CONSTRAINT ENGINE INTEGRATION (NEW)
// =============================================================================

/**
 * Enhanced risk classification with Constraint Engine validation
 * 
 * This function:
 * 1. Runs the standard LLM-based classification
 * 2. Validates against the Constraint Engine (EU AI Act knowledge base)
 * 3. Overrides LLM if constraint engine finds violations LLM missed
 * 4. Adds legal citations and audit trail
 */
export function classifyRiskWithConstraintValidation(
    analysis: LlmCapabilityAnalysis,
    intendedPurpose?: string
): RiskAssessmentResult {
    // Step 1: Run standard LLM-based classification
    const baseResult = classifyRisk(analysis, intendedPurpose);

    // Try constraint validation, but fall back to base result if it fails
    try {
        // Step 2: Get Constraint Engine
        const engine = getConstraintEngine();

        // Step 3: Extract indicators for constraint matching
        const libraries = analysis.ai_frameworks as string[] || [];
        const patterns: string[] = [];

        // Extract patterns from capabilities and risk indicators
        const capabilities = analysis.capabilities as string[] || [];
        const riskIndicators = analysis.estimated_risk_indicators as Record<string, boolean> || {};

        patterns.push(...capabilities);

        // Convert risk indicators to patterns
        if (riskIndicators.uses_biometric_processing) patterns.push('biometric', 'biometric_processing');
        if (riskIndicators.uses_emotion_recognition) patterns.push('emotion_recognition', 'emotion_detection');
        if (riskIndicators.uses_computer_vision) patterns.push('computer_vision', 'face_recognition');
        if (riskIndicators.uses_critical_infrastructure) patterns.push('critical_infrastructure', 'scada');
        if (riskIndicators.uses_generative_ai) patterns.push('generative_ai', 'llm', 'chatbot');
        if (riskIndicators.targets_vulnerable_persons) patterns.push('vulnerable_group', 'exploitation');
        if (riskIndicators.high_impact_decision_making) patterns.push('high_impact_decision', 'scoring');

        // Step 4: Run constraint matching
        const constraintResult = engine.matchConstraints(libraries, patterns, undefined, intendedPurpose);

        // Step 5: Validate LLM classification against constraints
        const validation = engine.validateLLMClassification(
            baseResult.risk_classification,
            baseResult.risk_score,
            libraries,
            patterns,
            undefined,
            intendedPurpose
        );

        // Step 6: Build legal citations
        const legalCitations = constraintResult.matches.map(match => ({
            constraint_id: match.constraint.constraint_id,
            regulation_source: match.constraint.regulation_source,
            official_text: match.constraint.official_text
        }));

        // NEW: Build prohibition_reasons from UNACCEPTABLE constraint matches
        const prohibitionReasons = constraintResult.matches
            .filter(m => m.constraint.risk_level === 'UNACCEPTABLE')
            .map(m => ({
                article: m.constraint.regulation_source,
                category: m.constraint.category,
                description: m.constraint.description,
                official_text: m.constraint.official_text,
                exceptions_exist: (m.constraint.exceptions?.length ?? 0) > 0,
                exception_questions: m.constraint.exceptions?.flatMap(e => e.verification_questions) || [],
            }));

        // Step 7: Determine final classification (constraint engine is source of truth)
        const finalClassification = validation.validated_risk;
        const wasOverridden = validation.was_overridden;

        // Step 8: Update key findings if escalated
        const enhancedFindings = [...baseResult.key_findings];

        if (wasOverridden) {
            enhancedFindings.unshift(
                `Regulatory Validation Adjustment: ${validation.override_reason}`
            );
        }

        // Add constraint-matched findings
        for (const match of constraintResult.matches) {
            if (match.constraint.risk_level === 'UNACCEPTABLE') {
                const newFinding = `PROHIBITED (${match.constraint.regulation_source}): ${match.constraint.category} — ${match.constraint.description} See official text: ${match.constraint.official_text.slice(0, 80)}...`;
                if (!enhancedFindings.includes(newFinding)) {
                    enhancedFindings.unshift(newFinding);
                }
            }
        }

        // Step 9: Update manual review if constraints require context
        const enhancedManualReview = baseResult.manual_review_needed ||
            constraintResult.requires_manual_review;

        let enhancedManualReviewReason = baseResult.manual_review_reason;
        if (constraintResult.requires_manual_review && !enhancedManualReviewReason) {
            enhancedManualReviewReason = 'Regulatory validation requires context verification - see questions below';
        }

        // Step 10: Recalculate risk score based on constraint matches
        const enhancedRiskScore = constraintResult.risk_score > baseResult.risk_score
            ? constraintResult.risk_score
            : baseResult.risk_score;

        // Step 11: Update narrative with legal citations
        const enhancedNarrative = generateEnhancedNarrative(
            finalClassification,
            baseResult.matched_annex_iii_articles,
            legalCitations,
            analysis.confidence_score ?? 0.5, // Default to 0.5 if undefined
            wasOverridden
        );

        return {
            ...baseResult,
            risk_classification: finalClassification,
            risk_score: enhancedRiskScore,
            key_findings: enhancedFindings,
            manual_review_needed: enhancedManualReview,
            manual_review_reason: enhancedManualReviewReason,
            risk_narrative: enhancedNarrative,
            preliminary_assessment: {
                is_unacceptable: finalClassification === 'UNACCEPTABLE',
                is_high_risk: finalClassification === 'HIGH_RISK',
                is_limited_risk: finalClassification === 'LIMITED_RISK',
                is_minimal_risk: finalClassification === 'MINIMAL_RISK',
                also_has_high_risk_elements: baseResult.matched_annex_iii_articles
                    .some(a => a.riskTier === 'HIGH_RISK' && a.applicable === true),
            },
            ...(prohibitionReasons.length > 0 ? { prohibition_reasons: prohibitionReasons } : {}),
            constraint_validation: {
                was_overridden: wasOverridden,
                override_reason: validation.override_reason,
                matched_constraint_ids: validation.matched_constraints,
                legal_citations: legalCitations,
                contextual_questions: constraintResult.contextual_questions,
                audit_trail: validation.audit_trail,
                purpose_filter: intendedPurpose ? (() => {
                    const mapping = PURPOSE_CATEGORY_MAP[intendedPurpose];
                    // FORCE_UNACCEPTABLE is a string sentinel — coerce it to a display string
                    const categoriesEvaluated: string[] | 'ALL' =
                        mapping === 'FORCE_UNACCEPTABLE'
                            ? []  // nothing to evaluate — direct Article 5 prohibition
                            : mapping === null
                                ? 'ALL'
                                : (mapping as string[]);
                    const categoriesSkipped: string[] =
                        mapping === 'FORCE_UNACCEPTABLE' || mapping === null
                            ? []
                            : ANNEX_III_CONSTRAINTS
                                .map((c: EUAIConstraint) => c.category)
                                .filter((cat: string, i: number, arr: string[]) => arr.indexOf(cat) === i)
                                .filter((cat: string) => !(mapping as string[]).includes(cat));
                    return {
                        declared_purpose: intendedPurpose,
                        categories_evaluated: categoriesEvaluated,
                        categories_skipped: categoriesSkipped,
                        note: mapping === 'FORCE_UNACCEPTABLE'
                            ? `Purpose '${intendedPurpose}' is directly prohibited under Article 5 — no Annex III filter applied`
                            : `Purpose '${intendedPurpose}' filters evaluation to: ${
                                (mapping as string[])?.join(', ') || 'none — all Annex III categories evaluated'
                            }`,
                    };
                })() : null,
            }
        };
    } catch (error) {
        // If constraint engine fails, log and return base result without constraint validation
        console.error('Regulatory Validation error (falling back to base classification):', error);

        // Return base result with empty constraint validation
        return {
            ...baseResult,
            constraint_validation: {
                was_overridden: false,
                override_reason: undefined,
                matched_constraint_ids: [],
                legal_citations: [],
                contextual_questions: [],
                audit_trail: {
                    detected_libraries: [],
                    detected_patterns: [],
                    constraint_matches: []
                },
                purpose_filter: null
            }
        };
    }
}

/**
 * Generate enhanced risk narrative with legal citations
 */
function generateEnhancedNarrative(
    classification: RiskClassification,
    matchedArticles: AnnexIIIMatch[],
    legalCitations: { constraint_id: string; regulation_source: string; official_text: string }[],
    confidenceScore: number,
    wasOverridden: boolean
): string {
    const narratives: string[] = [];

    if (wasOverridden) {
        narratives.push('This classification was validated against official EU AI Act regulatory text.');
    }

    switch (classification) {
        case 'UNACCEPTABLE':
            narratives.push('This AI system has been classified as UNACCEPTABLE under EU AI Act Article 5.');
            narratives.push('Systems in this category are PROHIBITED and cannot be placed on the market or used in the European Union.');
            break;
        case 'HIGH_RISK':
            narratives.push('This AI system has been classified as HIGH RISK under EU AI Act Annex III.');
            narratives.push('High-risk systems require conformity assessment, registration in EU database, human oversight, and continuous monitoring.');
            break;
        case 'LIMITED_RISK':
            narratives.push('This AI system has been classified as LIMITED RISK under EU AI Act Article 50.');
            narratives.push('Limited-risk systems require transparency measures: users must be informed they are interacting with AI.');
            break;
        case 'MINIMAL_RISK':
            narratives.push('This AI system has been classified as MINIMAL RISK.');
            narratives.push('Minimal-risk systems are generally exempt from specific requirements but should follow best practices.');
            break;
    }

    // Add legal citations
    if (legalCitations.length > 0) {
        const sources = [...new Set(legalCitations.map(c => c.regulation_source))];
        narratives.push(`This classification is legally grounded in: ${sources.join(', ')} per Regulation (EU) 2024/1689.`);
    }

    if (confidenceScore < 0.7) {
        narratives.push('Note: Analysis confidence is below 70% - manual verification recommended.');
    }

    return narratives.join(' ');
}

// =============================================================================
// GPAI-ENHANCED CLASSIFICATION (NEW)
// =============================================================================

/**
 * Enhanced risk classification with GPAI detection.
 * 
 * This wrapper:
 * 1. Runs the standard constraint-validated classification
 * 2. Runs GPAI classification (Chapter V, Articles 51-55)
 * 3. Merges results without modifying the base classification
 * 
 * ADDITIVE ONLY: Does not modify classifyRiskWithConstraintValidation behavior.
 * GPAI classification is a separate, parallel track.
 */
export function classifyRiskFull(
    analysis: LlmCapabilityAnalysis,
    intendedPurpose?: string
): RiskAssessmentResult {
    // Step 1: Run existing constraint-validated classification
    const baseResult = classifyRiskWithConstraintValidation(analysis, intendedPurpose);

    // Step 2: Run GPAI classification
    const gpaiResult = classifyGPAI(analysis);

    // Step 3: If GPAI deployer detected, enhance findings
    if (gpaiResult.is_gpai_deployer || gpaiResult.is_gpai_provider) {
        // Add GPAI-specific key findings
        const gpaiFindings: string[] = [];

        if (gpaiResult.is_gpai_deployer) {
            const providers = gpaiResult.detected_providers.map(p => p.provider_name).join(', ');
            gpaiFindings.push(`GPAI Deployer (Article 50, Ch. V): integrates ${providers} models.`);
            
            if (gpaiResult.open_source_exception) {
                gpaiFindings.push('Open-source exception may apply (Article 53(2)). However, Article 50 transparency still applies.');
            } else {
                gpaiFindings.push(`Obligation from 2 Aug 2026: disclose AI-generated content in machine-readable format. Open-source exception does NOT apply.`);
            }
        } else {
            if (gpaiResult.open_source_exception) {
                gpaiFindings.push('Open-source exception may apply (Article 53(2))');
            }
            gpaiFindings.push(`Article 50 transparency obligations apply from 2 August 2026`);
        }

        // Merge findings (GPAI findings prepended for visibility)
        baseResult.key_findings = [...gpaiFindings, ...baseResult.key_findings];

        // Add GPAI article references to legal citations if constraint validation exists
        if (baseResult.constraint_validation) {
            const gpaiCitations = gpaiResult.article_references.map(ref => ({
                constraint_id: `gpai_${ref.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                regulation_source: ref,
                official_text: `See ${ref} of Regulation (EU) 2024/1689`,
            }));
            baseResult.constraint_validation.legal_citations = [
                ...baseResult.constraint_validation.legal_citations,
                ...gpaiCitations,
            ];
        }

        // Enhance risk narrative with GPAI context and obligation separation
        let enhancedNarrative = `${baseResult.risk_narrative}\n\n${gpaiResult.summary}`;

        // Add explicit sections for separated obligations
        const providerObligations = gpaiResult.obligations.filter(o => o.applies_to === 'provider');
        const deployerObligations = gpaiResult.obligations.filter(o => o.applies_to === 'deployer');

        if (deployerObligations.length > 0) {
            enhancedNarrative += `\n\nYour Obligations:\n` + deployerObligations.map(o => `- ${o.title}: ${o.description}`).join('\n');
        }

        if (providerObligations.length > 0) {
            enhancedNarrative += `\n\nProvider Obligations (for your information):\n` + providerObligations.map(o => `- ${o.title}: ${o.description}`).join('\n');
        }

        baseResult.risk_narrative = enhancedNarrative;
    }

    // Step 4: Attach full GPAI classification
    baseResult.gpai_classification = gpaiResult;

    return baseResult;
}
