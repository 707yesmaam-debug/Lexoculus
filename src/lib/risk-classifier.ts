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
import { HIGH_RISK_ARTICLES, LIMITED_RISK_ARTICLES, UNACCEPTABLE_RISKS, EUAIConstraint } from './annex-iii-articles';
import { getConstraintEngine, ConstraintMatchResult, LLMValidationResult } from './constraint-engine';
import { classifyGPAI, GPAIClassification } from './gpai-classifier';
import { RiskEvidence } from './risk-evidence';
import { findLibraryByName } from './ai-library-database';

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
    };
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
    };

    // GPAI Classification (Chapter V, Articles 51-55)
    gpai_classification?: GPAIClassification;

    // Evidence Traceability (Phase 3)
    evidence: RiskEvidence[];
}

/**
 * Main risk classification function
 */
export function classifyRisk(analysis: LlmCapabilityAnalysis): RiskAssessmentResult {
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
    // STEP 1: Check UNACCEPTABLE RISK
    // ========================================

    if (indicators.targets_vulnerable_persons) {
        matchedArticles.push({
            article: 'Unacceptable',
            category: 'Targeting Vulnerable Persons',
            description: UNACCEPTABLE_RISKS[1].description,
            applicable: true,
            riskTier: 'UNACCEPTABLE',
            reasoning: 'System targets vulnerable groups such as children, elderly, or persons with disabilities',
        });
        riskClassification = 'UNACCEPTABLE';
        keyFindings.push('PROHIBITED: System targets vulnerable persons - not permitted under EU AI Act');
        manualReviewReason = 'UNACCEPTABLE risk detected - requires legal review';
    }

    // ========================================
    // STEP 2: Check HIGH RISK (Articles 6-27)
    // ========================================

    // Article 6-9: Biometric Identification & Categorization
    if (indicators.uses_biometric_processing) {
        // Map to Annex III(1)(a) - Remote Biometric Identification (most severe)
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Annex III(1)(a)') ||
            HIGH_RISK_ARTICLES.find(a => a.article === 'Article 6-9'); // Fallback

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: article.description,
                applicable: true,
                riskTier: 'HIGH_RISK',
                reasoning: 'Biometric processing detected - real-time or post biometric identification',
                requirements: article.requirements,
            });
            if (riskClassification !== 'UNACCEPTABLE') {
                riskClassification = 'HIGH_RISK';
            }
            keyFindings.push('Biometric processing detected - HIGH RISK');

            // Build evidence
            const relatedLibs = rawLibraries.filter(l => l.risk_indicators?.includes('uses_biometric_processing') ||
                l.category === 'biometrics');
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

    // Article 6-9: Emotion Recognition (HIGH_RISK if for access control)
    if (indicators.uses_emotion_recognition && indicators.uses_biometric_processing) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Annex III(1)(c)') ||
            HIGH_RISK_ARTICLES.find(a => a.article === 'Article 6-9');

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: 'Emotion Recognition for Access Control',
                description: 'Emotion recognition combined with biometric identification',
                applicable: true,
                riskTier: 'HIGH_RISK',
                reasoning: 'Emotion recognition used with biometric processing indicates access control use case',
                requirements: article.requirements,
            });
            if (riskClassification !== 'UNACCEPTABLE') {
                riskClassification = 'HIGH_RISK';
            }
            keyFindings.push('Emotion recognition with biometrics - HIGH RISK');
            const relatedLibs = rawLibraries.filter(l => l.risk_indicators?.includes('uses_emotion_recognition') ||
                l.category === 'biometrics');
            relatedLibs.forEach(lib => {
                evidenceList.push({
                    type: 'dependency',
                    name: lib.name || lib.matched_string || 'unknown',
                    source_file: lib.source || 'unknown',
                    version: lib.version,
                    risk_indicators: ['uses_emotion_recognition', 'uses_biometric_processing'],
                    triggered_articles: [article.article],
                    severity: 'high',
                });
            });
        }
    }

    // Article 15: Critical Infrastructure
    if (indicators.uses_critical_infrastructure) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Annex III(2)') ||
            HIGH_RISK_ARTICLES.find(a => a.article === 'Article 15');

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: article.description,
                applicable: true,
                riskTier: 'HIGH_RISK',
                reasoning: 'System may control or manage critical infrastructure',
                requirements: article.requirements,
            });
            if (riskClassification !== 'UNACCEPTABLE') {
                riskClassification = 'HIGH_RISK';
            }
            keyFindings.push('Critical infrastructure involvement - HIGH RISK');
            const relatedLibs = rawLibraries.filter(l => l.risk_indicators?.includes('uses_critical_infrastructure'));
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

    // Article 21: Employment Decisions (conditional)
    const hasClassificationCapability = capabilities.some(c =>
        c.toLowerCase().includes('classification') ||
        c.toLowerCase().includes('decision') ||
        c.toLowerCase().includes('scoring') ||
        c.toLowerCase().includes('ranking')
    );

    if (analysis.has_ml_pipeline &&
        analysis.has_training_code &&
        analysis.has_inference_code &&
        hasClassificationCapability) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Annex III(4)') ||
            HIGH_RISK_ARTICLES.find(a => a.article === 'Article 21');

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: article.description,
                applicable: 'conditional',
                riskTier: 'HIGH_RISK',
                reasoning: 'System has classification/decision capability - if used for employment decisions, requires HIGH RISK assessment',
                requirements: article.requirements,
            });
            // DO NOT ESCALATE riskClassification to HIGH_RISK here.
            // Wait for context verification.
            if (riskClassification === 'MINIMAL_RISK') {
                riskClassification = 'LIMITED_RISK';
            }
            keyFindings.push('Potential employment decision system - verify use case in Feature 4');
            unmatchedIndicators.push('employment_decision_capability');
        }
    }

    // Article 22: Essential Services (conditional)
    const hasFinancialCapability = capabilities.some(c =>
        c.toLowerCase().includes('credit') ||
        c.toLowerCase().includes('risk') ||
        c.toLowerCase().includes('insurance') ||
        c.toLowerCase().includes('loan') ||
        c.toLowerCase().includes('eligibility')
    );

    if (hasFinancialCapability && analysis.has_ml_pipeline) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Annex III(5)') ||
            HIGH_RISK_ARTICLES.find(a => a.article === 'Article 22');

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: article.description,
                applicable: 'conditional',
                riskTier: 'HIGH_RISK',
                reasoning: 'System has financial/risk assessment capability - if used for credit/insurance decisions, requires HIGH RISK assessment',
                requirements: article.requirements,
            });
            // DO NOT ESCALATE riskClassification to HIGH_RISK here.
            // Wait for context verification.
            if (riskClassification === 'MINIMAL_RISK') {
                riskClassification = 'LIMITED_RISK';
            }
            keyFindings.push('Potential financial decision system - verify use case in Feature 4');
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

    if (hasAutonomousCapability) {
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

    // Article 37: Emotion Recognition (not for access control)
    if (indicators.uses_emotion_recognition && !indicators.uses_biometric_processing) {
        const article = LIMITED_RISK_ARTICLES.find(a => a.article === 'Article 50(3)') ||
            LIMITED_RISK_ARTICLES.find(a => a.article === 'Article 37');

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: article.description,
                applicable: true,
                riskTier: 'LIMITED_RISK',
                reasoning: 'Emotion recognition without biometric identification - requires transparency',
                requirements: article.requirements,
            });
            if (riskClassification === 'MINIMAL_RISK') {
                riskClassification = 'LIMITED_RISK';
            }
            keyFindings.push('Emotion recognition system - LIMITED RISK (requires transparency)');
            const relatedLibs = rawLibraries.filter(l => l.risk_indicators?.includes('uses_emotion_recognition'));
            relatedLibs.forEach(lib => {
                evidenceList.push({
                    type: 'dependency',
                    name: lib.name || lib.matched_string || 'unknown',
                    source_file: lib.source || 'unknown',
                    version: lib.version,
                    risk_indicators: ['uses_emotion_recognition'],
                    triggered_articles: [article.article],
                    severity: 'medium',
                });
            });
        }
    }

    // Article 39: Code/Content Generation (Generative AI)
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

        if (article) {
            matchedArticles.push({
                article: article.article,
                category: article.category,
                description: article.description,
                applicable: true,
                riskTier: 'LIMITED_RISK',
                reasoning: 'Generative AI system detected - generates code, text, or synthetic content',
                requirements: article.requirements,
            });
            if (riskClassification === 'MINIMAL_RISK') {
                riskClassification = 'LIMITED_RISK';
            }
            keyFindings.push('Generative AI system - LIMITED RISK (requires AI-generated content labeling)');
            const relatedLibs = rawLibraries.filter(l => l.risk_indicators?.includes('uses_generative_ai') ||
                l.category === 'generative_ai');
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

    switch (classification) {
        case 'UNACCEPTABLE':
            narratives.push('This AI system has been classified as UNACCEPTABLE under the EU AI Act.');
            narratives.push('Systems in this category are prohibited and cannot be deployed in the European Union.');
            break;
        case 'HIGH_RISK':
            narratives.push('This AI system has been classified as HIGH RISK under the EU AI Act Annex III.');
            narratives.push('High-risk systems require extensive compliance documentation, conformity assessment, and ongoing monitoring.');
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

    if (matchedArticles.length > 0) {
        const articleList = matchedArticles.map(a => a.article).join(', ');
        narratives.push(`Matched Annex III articles: ${articleList}.`);
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
    analysis: LlmCapabilityAnalysis
): RiskAssessmentResult {
    // Step 1: Run standard LLM-based classification
    const baseResult = classifyRisk(analysis);

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
        const constraintResult = engine.matchConstraints(libraries, patterns);

        // Step 5: Validate LLM classification against constraints
        const validation = engine.validateLLMClassification(
            baseResult.risk_classification,
            baseResult.risk_score,
            libraries,
            patterns
        );

        // Step 6: Build legal citations
        const legalCitations = constraintResult.matches.map(match => ({
            constraint_id: match.constraint.constraint_id,
            regulation_source: match.constraint.regulation_source,
            official_text: match.constraint.official_text
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
                enhancedFindings.unshift(
                    `PROHIBITED (${match.constraint.regulation_source}): ${match.constraint.category}`
                );
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
            },
            constraint_validation: {
                was_overridden: wasOverridden,
                override_reason: validation.override_reason,
                matched_constraint_ids: validation.matched_constraints,
                legal_citations: legalCitations,
                contextual_questions: constraintResult.contextual_questions,
                audit_trail: validation.audit_trail
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
                }
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
        narratives.push(`Legal basis: ${sources.join(', ')} of Regulation (EU) 2024/1689.`);
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
    analysis: LlmCapabilityAnalysis
): RiskAssessmentResult {
    // Step 1: Run existing constraint-validated classification
    const baseResult = classifyRiskWithConstraintValidation(analysis);

    // Step 2: Run GPAI classification
    const gpaiResult = classifyGPAI(analysis);

    // Step 3: If GPAI deployer detected, enhance findings
    if (gpaiResult.is_gpai_deployer || gpaiResult.is_gpai_provider) {
        // Add GPAI-specific key findings
        const gpaiFindings: string[] = [];

        if (gpaiResult.is_gpai_deployer) {
            const providers = gpaiResult.detected_providers.map(p => p.provider_name).join(', ');
            gpaiFindings.push(`GPAI Deployer: integrates models from ${providers}`);
        }

        if (gpaiResult.open_source_exception) {
            gpaiFindings.push('Open-source exception may apply (Article 53(2))');
        }

        gpaiFindings.push(`Article 50 transparency obligations apply from 2 August 2026`);

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
