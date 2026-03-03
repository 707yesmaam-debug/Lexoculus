/**
 * Constraint Engine - EU AI Act Compliance Matcher
 * 
 * Matches detected code patterns/libraries against regulatory constraints
 * and validates LLM outputs against the knowledge base.
 * 
 * Source: Regulation (EU) 2024/1689
 */

import {
    EUAIConstraint,
    RiskTier,
    ALL_CONSTRAINTS,
    ARTICLE_5_CONSTRAINTS,
    ANNEX_III_CONSTRAINTS,
    LIMITED_RISK_CONSTRAINTS
} from './annex-iii-articles';

/**
 * Purpose-category mapping for filtering HIGH_RISK constraints.
 * Maps intended purpose to eligible Annex III categories.
 * Empty array = no high-risk categories eligible.
 * null/undefined = all categories eligible (no filtering).
 */
const PURPOSE_ELIGIBLE_CATEGORIES: Record<string, string[] | null> = {
    'developer_tool': [],
    'api_middleware': [],
    'chatbot': [],
    'data_analytics': [],
    'content_generation': [],
    'critical_infrastructure': ['Critical Infrastructure'],
    'financial_services': ['Essential Services Access'],
    'healthcare': ['Critical Infrastructure'],
    'hr_recruitment': ['Employment & Worker Management'],
    'law_enforcement': ['Law Enforcement'],
    'education': ['Education & Vocational Training'],
    'biometrics': ['Remote Biometric Identification', 'Biometric Categorization', 'Emotion Recognition'],
    'migration_border': ['Migration, Asylum & Border Control'],
    'justice_legal': ['Administration of Justice'],
    'autonomous_vehicles': ['Autonomous Vehicles'],
    'general': null,
};

// =============================================================================
// TYPES
// =============================================================================

export interface ConstraintMatch {
    constraint: EUAIConstraint;
    matched_indicators: string[];
    confidence: number; // 0-1
    requires_context: boolean;
}

export interface ConstraintMatchResult {
    matches: ConstraintMatch[];
    highest_risk: RiskTier;
    risk_score: number; // 0-100
    contextual_questions: string[];
    requires_manual_review: boolean;
}

export interface LLMValidationResult {
    original_risk: RiskTier;
    validated_risk: RiskTier;
    was_overridden: boolean;
    override_reason?: string;
    matched_constraints: string[];
    audit_trail: {
        detected_libraries: string[];
        detected_patterns: string[];
        constraint_matches: string[];
    };
}

// =============================================================================
// CONSTRAINT ENGINE CLASS
// =============================================================================

export class ConstraintEngine {
    private constraints: EUAIConstraint[];

    constructor(constraints?: EUAIConstraint[]) {
        this.constraints = constraints || ALL_CONSTRAINTS;
    }

    // =========================================================================
    // Core Matching Logic
    // =========================================================================

    /**
     * Match detected code indicators against regulatory constraints
     */
    matchConstraints(
        detectedLibraries: string[],
        detectedPatterns: string[],
        deploymentContext?: string,
        intendedPurpose?: string
    ): ConstraintMatchResult {
        const allIndicators = [
            ...detectedLibraries.map(l => l.toLowerCase()),
            ...detectedPatterns.map(p => p.toLowerCase())
        ];

        const contextWords = deploymentContext
            ? deploymentContext.toLowerCase().split(/\s+/)
            : [];

        const matches: ConstraintMatch[] = [];

        // Determine eligible categories based on intended purpose
        const eligibleCategories = intendedPurpose
            ? PURPOSE_ELIGIBLE_CATEGORIES[intendedPurpose]
            : null; // null = no filtering

        for (const constraint of this.constraints) {
            // Purpose-based filtering: skip HIGH_RISK constraints whose category
            // doesn't match the declared purpose. UNACCEPTABLE and LIMITED_RISK
            // are never filtered — safety bans and transparency always apply.
            if (
                intendedPurpose &&
                eligibleCategories !== null &&
                eligibleCategories !== undefined &&
                constraint.risk_level === 'HIGH_RISK' &&
                !eligibleCategories.includes(constraint.category)
            ) {
                continue;
            }

            const matchResult = this.matchSingleConstraint(
                constraint,
                allIndicators,
                contextWords
            );

            if (matchResult) {
                matches.push(matchResult);
            }
        }

        // Sort by risk level (UNACCEPTABLE first)
        matches.sort((a, b) => {
            const riskOrder = { UNACCEPTABLE: 0, HIGH_RISK: 1, LIMITED_RISK: 2, MINIMAL_RISK: 3 };
            return riskOrder[a.constraint.risk_level] - riskOrder[b.constraint.risk_level];
        });

        // Determine highest risk
        const highestRisk = this.getHighestRiskLevel(matches.map(m => m.constraint));

        // Calculate risk score
        const riskScore = this.calculateRiskScore(matches);

        // Collect contextual questions
        const contextualQuestions = this.getContextualQuestions(matches);

        // Determine if manual review needed
        const requiresManualReview = matches.some(
            m => m.constraint.risk_level === 'UNACCEPTABLE' ||
                m.constraint.detection_method === 'context' ||
                m.requires_context
        );

        return {
            matches,
            highest_risk: highestRisk,
            risk_score: riskScore,
            contextual_questions: contextualQuestions,
            requires_manual_review: requiresManualReview
        };
    }

    /**
     * Match a single constraint against indicators
     */
    private matchSingleConstraint(
        constraint: EUAIConstraint,
        indicators: string[],
        contextWords: string[]
    ): ConstraintMatch | null {
        const matchedIndicators: string[] = [];
        let confidence = 0;

        // Check code indicators
        for (const codeIndicator of constraint.code_indicators) {
            const lowerIndicator = codeIndicator.toLowerCase();

            for (const detected of indicators) {
                if (this.fuzzyMatch(detected, lowerIndicator)) {
                    matchedIndicators.push(codeIndicator);
                    confidence += 0.3;
                }
            }
        }

        // Check context words for context-based detection
        if (constraint.detection_method === 'context' || constraint.detection_method === 'combination') {
            for (const codeIndicator of constraint.code_indicators) {
                const lowerIndicator = codeIndicator.toLowerCase();

                for (const word of contextWords) {
                    if (this.fuzzyMatch(word, lowerIndicator)) {
                        matchedIndicators.push(`context:${codeIndicator}`);
                        confidence += 0.2;
                    }
                }
            }
        }

        if (matchedIndicators.length === 0) {
            return null;
        }

        // Normalize confidence to 0-1
        confidence = Math.min(confidence, 1);

        // Determine if context verification needed
        const requiresContext: boolean =
            constraint.detection_method === 'context' ||
            constraint.detection_method === 'combination' ||
            Boolean(constraint.exceptions && constraint.exceptions.length > 0);

        return {
            constraint,
            matched_indicators: [...new Set(matchedIndicators)],
            confidence,
            requires_context: requiresContext
        };
    }

    /**
     * Fuzzy matching for indicator detection
     */
    private fuzzyMatch(detected: string, target: string): boolean {
        // Exact match
        if (detected === target) return true;

        // Substring match
        if (detected.includes(target) || target.includes(detected)) return true;

        // Underscore/dash variants
        const normalizedDetected = detected.replace(/[-_]/g, '');
        const normalizedTarget = target.replace(/[-_]/g, '');
        if (normalizedDetected.includes(normalizedTarget) ||
            normalizedTarget.includes(normalizedDetected)) return true;

        return false;
    }

    // =========================================================================
    // Risk Scoring
    // =========================================================================

    /**
     * Get highest risk level from matched constraints
     */
    private getHighestRiskLevel(constraints: EUAIConstraint[]): RiskTier {
        if (constraints.length === 0) return 'MINIMAL_RISK';

        const riskOrder: RiskTier[] = ['UNACCEPTABLE', 'HIGH_RISK', 'LIMITED_RISK', 'MINIMAL_RISK'];

        for (const level of riskOrder) {
            if (constraints.some(c => c.risk_level === level)) {
                return level;
            }
        }

        return 'MINIMAL_RISK';
    }

    /**
     * Calculate numeric risk score (0-100)
     */
    private calculateRiskScore(matches: ConstraintMatch[]): number {
        if (matches.length === 0) return 0;

        const riskWeights: Record<RiskTier, number> = {
            'UNACCEPTABLE': 100,
            'HIGH_RISK': 75,
            'LIMITED_RISK': 35,
            'MINIMAL_RISK': 10
        };

        // Base score from highest risk
        const baseScore = Math.max(
            ...matches.map(m => riskWeights[m.constraint.risk_level])
        );

        // Add confidence-weighted score for each match
        const confidenceBonus = matches.reduce(
            (sum, m) => sum + (m.confidence * 5),
            0
        );

        return Math.min(Math.round(baseScore + confidenceBonus), 100);
    }

    // =========================================================================
    // Contextual Questions
    // =========================================================================

    /**
     * Get all contextual questions for matched constraints
     */
    getContextualQuestions(matches: ConstraintMatch[]): string[] {
        const questions = new Set<string>();

        for (const match of matches) {
            // Add constraint-specific questions
            if (match.constraint.contextual_questions) {
                for (const q of match.constraint.contextual_questions) {
                    questions.add(q);
                }
            }

            // Add exception verification questions
            if (match.constraint.exceptions) {
                for (const exc of match.constraint.exceptions) {
                    for (const q of exc.verification_questions) {
                        questions.add(q);
                    }
                }
            }
        }

        return Array.from(questions);
    }

    // =========================================================================
    // LLM Validation
    // =========================================================================

    /**
     * Validate LLM risk classification against constraint engine
     * The constraint engine is the source of truth
     */
    validateLLMClassification(
        llmRiskLevel: RiskTier,
        llmRiskScore: number,
        detectedLibraries: string[],
        detectedPatterns: string[],
        deploymentContext?: string,
        intendedPurpose?: string
    ): LLMValidationResult {
        // Run constraint matching (with purpose-aware filtering)
        const matchResult = this.matchConstraints(
            detectedLibraries,
            detectedPatterns,
            deploymentContext,
            intendedPurpose
        );

        const validatedRisk = matchResult.highest_risk;
        const wasOverridden = llmRiskLevel !== validatedRisk;

        let overrideReason: string | undefined;

        if (wasOverridden) {
            const riskOrder: Record<RiskTier, number> = {
                'UNACCEPTABLE': 4,
                'HIGH_RISK': 3,
                'LIMITED_RISK': 2,
                'MINIMAL_RISK': 1
            };

            if (riskOrder[validatedRisk] > riskOrder[llmRiskLevel]) {
                overrideReason = `Regulatory Validation ESCALATED risk from ${llmRiskLevel} to ${validatedRisk}. ` +
                    `Matched constraints: ${matchResult.matches.map(m => m.constraint.constraint_id).join(', ')}`;
            } else {
                overrideReason = `Regulatory Validation DE-ESCALATED risk from ${llmRiskLevel} to ${validatedRisk}. ` +
                    `No high-risk constraints matched.`;
            }
        }

        return {
            original_risk: llmRiskLevel,
            validated_risk: validatedRisk,
            was_overridden: wasOverridden,
            override_reason: overrideReason,
            matched_constraints: matchResult.matches.map(m => m.constraint.constraint_id),
            audit_trail: {
                detected_libraries: detectedLibraries,
                detected_patterns: detectedPatterns,
                constraint_matches: matchResult.matches.map(m =>
                    `${m.constraint.constraint_id}: ${m.matched_indicators.join(', ')}`
                )
            }
        };
    }

    /**
     * Validate exception claims from user context answers
     */
    validateException(
        constraintId: string,
        exceptionIndex: number,
        userAnswers: Record<string, boolean>
    ): { valid: boolean; reason: string } {
        const constraint = this.constraints.find(c => c.constraint_id === constraintId);

        if (!constraint) {
            return { valid: false, reason: `Constraint ${constraintId} not found` };
        }

        if (!constraint.exceptions || !constraint.exceptions[exceptionIndex]) {
            return { valid: false, reason: `No exception at index ${exceptionIndex}` };
        }

        const exception = constraint.exceptions[exceptionIndex];

        // All verification questions must be answered true for exception to apply
        const allVerified = exception.verification_questions.every(
            q => userAnswers[q] === true
        );

        if (allVerified) {
            return {
                valid: true,
                reason: `Exception applies: ${exception.description}`
            };
        } else {
            const failedQuestions = exception.verification_questions.filter(
                q => userAnswers[q] !== true
            );
            return {
                valid: false,
                reason: `Exception does not apply. Failed verification: ${failedQuestions.join('; ')}`
            };
        }
    }

    // =========================================================================
    // Utility Methods
    // =========================================================================

    /**
     * Get constraints by risk level
     */
    getConstraintsByRisk(level: RiskTier): EUAIConstraint[] {
        return this.constraints.filter(c => c.risk_level === level);
    }

    /**
     * Get all Article 5 (UNACCEPTABLE) constraints
     */
    getUnacceptableConstraints(): EUAIConstraint[] {
        return ARTICLE_5_CONSTRAINTS;
    }

    /**
     * Get all Annex III (HIGH_RISK) constraints
     */
    getHighRiskConstraints(): EUAIConstraint[] {
        return ANNEX_III_CONSTRAINTS;
    }

    /**
     * Get all Article 50 (LIMITED_RISK) constraints
     */
    getLimitedRiskConstraints(): EUAIConstraint[] {
        return LIMITED_RISK_CONSTRAINTS;
    }

    /**
     * Find constraint by ID
     */
    findById(id: string): EUAIConstraint | undefined {
        return this.constraints.find(c => c.constraint_id === id);
    }

    /**
     * Get total constraint count
     */
    get count(): number {
        return this.constraints.length;
    }
}

// =============================================================================
// FACTORY & SINGLETON
// =============================================================================

let _instance: ConstraintEngine | null = null;

/**
 * Get singleton instance of ConstraintEngine
 */
export function getConstraintEngine(): ConstraintEngine {
    if (!_instance) {
        _instance = new ConstraintEngine();
    }
    return _instance;
}

/**
 * Create new ConstraintEngine with custom constraints
 */
export function createConstraintEngine(constraints: EUAIConstraint[]): ConstraintEngine {
    return new ConstraintEngine(constraints);
}

// =============================================================================
// QUICK PATTERN MATCHING (for GitHub Action - fast, no LLM)
// =============================================================================

/** High-priority patterns for fast PR scanning */
export const QUICK_RISK_PATTERNS = {
    UNACCEPTABLE: [
        'face_recognition', 'deepface', 'social_score', 'social_credit',
        'subliminal', 'manipulation', 'emotion_recognition'
    ],
    HIGH_RISK: [
        'biometric', 'facial_matching', 'credit_scoring', 'hiring',
        'recruitment', 'resume_screening', 'law_enforcement', 'police',
        'border_control', 'visa_processing', 'judicial', 'sentencing'
    ],
    LIMITED_RISK: [
        'openai', 'anthropic', 'langchain', 'chatgpt', 'gpt', 'llm',
        'dalle', 'stable_diffusion', 'midjourney', 'deepfake'
    ]
};

/**
 * Fast pattern matching for PR scanning (no LLM required)
 * Returns highest risk level found, or null if no match
 */
export function quickPatternMatch(codeContent: string): {
    risk_level: RiskTier | null;
    matched_patterns: string[];
} {
    const lowerContent = codeContent.toLowerCase();
    const matched: string[] = [];

    // Check UNACCEPTABLE first
    for (const pattern of QUICK_RISK_PATTERNS.UNACCEPTABLE) {
        if (lowerContent.includes(pattern)) {
            matched.push(pattern);
            return { risk_level: 'UNACCEPTABLE', matched_patterns: matched };
        }
    }

    // Check HIGH_RISK
    for (const pattern of QUICK_RISK_PATTERNS.HIGH_RISK) {
        if (lowerContent.includes(pattern)) {
            matched.push(pattern);
        }
    }
    if (matched.length > 0) {
        return { risk_level: 'HIGH_RISK', matched_patterns: matched };
    }

    // Check LIMITED_RISK
    for (const pattern of QUICK_RISK_PATTERNS.LIMITED_RISK) {
        if (lowerContent.includes(pattern)) {
            matched.push(pattern);
        }
    }
    if (matched.length > 0) {
        return { risk_level: 'LIMITED_RISK', matched_patterns: matched };
    }

    return { risk_level: null, matched_patterns: [] };
}
