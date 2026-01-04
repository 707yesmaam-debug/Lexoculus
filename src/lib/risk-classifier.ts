/**
 * Risk Classification Engine
 * 
 * Maps AI capabilities from Feature 2 to EU AI Act Annex III articles
 * and determines risk classification.
 */

import { LlmCapabilityAnalysis } from '@prisma/client';
import { HIGH_RISK_ARTICLES, LIMITED_RISK_ARTICLES, UNACCEPTABLE_RISKS } from './annex-iii-articles';

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

    // Parse risk indicators from JSON
    const indicators = analysis.estimated_risk_indicators as RiskIndicators;
    const capabilities = analysis.capabilities as string[];
    const detectedModelTypes = analysis.detected_model_types as string[];

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
        keyFindings.push('⚠️ BANNED: System targets vulnerable persons - not permitted under EU AI Act');
        manualReviewReason = 'UNACCEPTABLE risk detected - requires legal review';
    }

    // ========================================
    // STEP 2: Check HIGH RISK (Articles 6-27)
    // ========================================

    // Article 6-9: Biometric Identification & Categorization
    if (indicators.uses_biometric_processing) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Article 6-9')!;
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
        keyFindings.push('⚠️ Biometric processing detected - HIGH RISK');
    }

    // Article 6-9: Emotion Recognition (HIGH_RISK if for access control)
    if (indicators.uses_emotion_recognition && indicators.uses_biometric_processing) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Article 6-9')!;
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
        keyFindings.push('⚠️ Emotion recognition with biometrics - HIGH RISK');
    }

    // Article 15: Critical Infrastructure
    if (indicators.uses_critical_infrastructure) {
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Article 15')!;
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
        keyFindings.push('⚠️ Critical infrastructure involvement - HIGH RISK');
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
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Article 21')!;
        matchedArticles.push({
            article: article.article,
            category: article.category,
            description: article.description,
            applicable: 'conditional',
            riskTier: 'HIGH_RISK',
            reasoning: 'System has classification/decision capability - if used for employment decisions, requires HIGH RISK assessment',
            requirements: article.requirements,
        });
        keyFindings.push('⚠️ Potential employment decision system - verify use case in Feature 4');
        unmatchedIndicators.push('employment_decision_capability');
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
        const article = HIGH_RISK_ARTICLES.find(a => a.article === 'Article 22')!;
        matchedArticles.push({
            article: article.article,
            category: article.category,
            description: article.description,
            applicable: 'conditional',
            riskTier: 'HIGH_RISK',
            reasoning: 'System has financial/risk assessment capability - if used for credit/insurance decisions, requires HIGH RISK assessment',
            requirements: article.requirements,
        });
        keyFindings.push('⚠️ Potential financial decision system - verify use case in Feature 4');
        unmatchedIndicators.push('financial_decision_capability');
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
        keyFindings.push('⚠️ Autonomous vehicle system detected - HIGH RISK');
    }

    // ========================================
    // STEP 3: Check LIMITED RISK (Articles 37-40)
    // ========================================

    // Article 37: Emotion Recognition (not for access control)
    if (indicators.uses_emotion_recognition && !indicators.uses_biometric_processing) {
        const article = LIMITED_RISK_ARTICLES.find(a => a.article === 'Article 37')!;
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
        const article = LIMITED_RISK_ARTICLES.find(a => a.article === 'Article 39')!;
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
        const article = LIMITED_RISK_ARTICLES.find(a => a.article === 'Article 40')!;
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
    }

    // ========================================
    // STEP 4: Handle NLP Systems
    // ========================================

    if (indicators.uses_nlp && !isGenerativeSystem) {
        // NLP without generative AI is generally lower risk
        if (indicators.uses_nlp_decision_making) {
            unmatchedIndicators.push('nlp_decision_making');
            keyFindings.push('⚠️ NLP used for decision-making - verify context in Feature 4');
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
        keyFindings.push('⚠️ High-impact decision capabilities detected - requires context verification');
    }

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
