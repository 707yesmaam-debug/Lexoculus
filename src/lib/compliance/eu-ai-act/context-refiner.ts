/**
 * Context Refiner Engine
 * 
 * Refines preliminary risk assessment based on user-provided context
 * and generates compliance evidence.
 */

import { RiskAssessment } from '@prisma/client';

// Types
export type RiskClassification = 'UNACCEPTABLE' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK';
export type ComplianceReadinessLevel = 'FULL_COMPLIANCE' | 'PARTIAL_COMPLIANCE' | 'NON_COMPLIANCE' | 'NEEDS_REVIEW';

export interface ContextAnswers {
    // Use Case
    primary_purpose?: string;
    primary_users?: string;
    autonomous_decisions?: string;

    // Biometrics (Article 6-9)
    uses_biometrics?: string;
    law_enforcement_use?: boolean;
    biometric_opt_out?: string;

    // Employment (Article 21)
    uses_for_hiring?: string;
    candidates_informed?: string;
    hiring_appeal_process?: string;

    // Essential Services (Article 22)
    financial_decisions?: string;
    financial_transparency?: string;
    financial_human_review?: string;

    // Code Generation (Article 39)
    output_labeling?: string;
    ai_disable_option?: string;
    quality_monitoring?: string;

    // Deployment
    deployment_region?: string;
    operator_type?: string;

    // Safety
    human_oversight?: string;
    testing_procedure?: string;
    error_procedure?: string;

    // Transparency
    transparency_statement?: string;
    support_contact?: string;
    data_protection?: string;

    [key: string]: string | boolean | undefined;
}

export interface ContextSummary {
    intended_use: string;
    target_users: string;
    deployment_region: string;
    purpose_mismatch: boolean;
    purpose_mismatch_reason?: string;
    has_human_oversight: boolean;
    has_testing_procedure: boolean;
    has_transparency_statement: boolean;
    has_appeal_mechanism: boolean;
    has_data_safeguards: boolean;
    has_architecture_diagram: boolean;
    has_human_policy_document: boolean;
    has_data_policy_document: boolean;
}

export interface EvidenceItem {
    category: string;
    description: string;
    supports_classification: RiskClassification | 'ESCALATES_RISK';
    regulatory_reference?: string;
    user_provided: boolean;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    action_item?: string;
}

export interface MatchedArticle {
    article: string;
    category: string;
    verified: boolean;
    requirements: string[];
    user_confirmed_measures?: string[];
}

export interface ComplianceReadiness {
    overall_readiness: ComplianceReadinessLevel;
    requirements_met: string[];
    requirements_pending: string[];
    developer_action_items: string[];
}

export interface FinalAssessmentResult {
    final_risk_classification: RiskClassification;
    final_risk_score: number;
    final_narrative: string;
    context_verified: boolean;
    context_summary: ContextSummary;
    evidence_items: EvidenceItem[];
    final_matched_articles: MatchedArticle[];
    unresolved_risk_indicators: string[];
    escalation_reason?: string;
    compliance_readiness: ComplianceReadiness;
    approved_for_report: boolean;
    requires_manual_review: boolean;
}

interface PreliminaryArticle {
    article: string;
    category: string;
    applicable: boolean | 'conditional';
    riskTier?: RiskClassification;
    requirements?: string[];
}

/**
 * Main context refinement function
 */
export function refineWithContext(
    preliminary: RiskAssessment,
    answers: ContextAnswers
): FinalAssessmentResult {
    let finalClassification: RiskClassification = preliminary.risk_classification as RiskClassification;
    const evidenceItems: EvidenceItem[] = [];
    const unresolvedIndicators: string[] = [];
    const finalMatchedArticles: MatchedArticle[] = [];
    let requiresManualReview = false;
    let escalationReason: string | undefined;

    const preliminaryArticles = (preliminary.matched_annex_iii_articles as unknown as PreliminaryArticle[]) || [];
    
    // ========================================
    // STEP 0: Purpose Mismatch Detection
    // ========================================
    const intendedPurpose = (preliminary as any).intended_purpose as string | undefined | null;
    const mismatchCheck = detectPurposeMismatch(intendedPurpose, answers);
    if (mismatchCheck.has_mismatch) {
        evidenceItems.push({
            category: 'ISSUE: Purpose Mismatch',
            description: mismatchCheck.reason || 'Declared purpose does not match context answers',
            supports_classification: 'ESCALATES_RISK',
            user_provided: true,
            confidence: 'HIGH',
            action_item: 'REQUIRED: Update declared purpose or correct context answers before report generation',
        });
        requiresManualReview = true;
        escalationReason = mismatchCheck.reason;
    }

    // ========================================
    // STEP 1: Generate Use Case Evidence
    // ========================================

    const intendedUse = getReadableValue(answers.primary_purpose, {
        'code_generation': 'Code generation / development assistance',
        'content_recommendation': 'Content recommendation',
        'data_analysis': 'Data analysis / insights',
        'image_video_processing': 'Image/video processing',
        'decision_support': 'Decision support systems',
        'safety_critical': 'Safety-critical function',
        'other': 'Other purpose',
    });

    const targetUsers = getReadableValue(answers.primary_users, {
        'developers': 'Software developers',
        'analysts': 'Business analysts',
        'hr_managers': 'HR/Hiring managers',
        'financial': 'Financial analysts',
        'law_enforcement': 'Law enforcement',
        'general_public': 'General public',
        'other': 'Other users',
    });

    evidenceItems.push({
        category: 'Use Case Verification',
        description: `System is used for ${intendedUse}. Target users: ${targetUsers}`,
        supports_classification: finalClassification,
        user_provided: true,
        confidence: 'HIGH',
    });

    // ========================================
    // STEP 2: Check for Autonomy Issues
    // ========================================

    if (answers.autonomous_decisions === 'yes_automated' &&
        answers.human_oversight === 'no') {
        evidenceItems.push({
            category: 'ISSUE: Missing Human Oversight',
            description: 'System makes autonomous decisions without human review',
            supports_classification: 'ESCALATES_RISK',
            user_provided: true,
            confidence: 'HIGH',
            action_item: 'REQUIRED: Implement human review process',
        });

        if (finalClassification === 'MINIMAL_RISK') {
            finalClassification = 'LIMITED_RISK';
        }
        requiresManualReview = true;
    }

    // ========================================
    // STEP 3: Process HIGH_RISK Articles
    // ========================================

    // Article 6-9: Biometrics
    const hasBiometricsArticle = preliminaryArticles.some(a =>
        a.article.includes('6') || a.article.includes('9')
    );

    if (hasBiometricsArticle) {
        if (answers.uses_biometrics === 'realtime_id') {
            evidenceItems.push({
                category: 'CRITICAL: Real-time Biometric ID',
                description: 'System uses real-time biometric identification - UNACCEPTABLE under EU AI Act',
                supports_classification: 'ESCALATES_RISK',
                regulatory_reference: 'Article 5: Prohibited AI Practices',
                user_provided: true,
                confidence: 'HIGH',
                action_item: 'REQUIRED: Remove real-time biometric identification or apply for narrow exemption',
            });
            finalClassification = 'UNACCEPTABLE';
            requiresManualReview = true;
            escalationReason = 'Real-time biometric identification is prohibited';
        } else if (answers.uses_biometrics === 'no') {
            evidenceItems.push({
                category: 'Biometric Verification',
                description: 'System does NOT process biometric data. Article 6-9 does not apply.',
                supports_classification: finalClassification,
                user_provided: true,
                confidence: 'HIGH',
            });
        }

        if (answers.law_enforcement_use === true) {
            evidenceItems.push({
                category: 'Law Enforcement Use',
                description: 'System used by law enforcement - requires strict oversight',
                supports_classification: 'ESCALATES_RISK',
                regulatory_reference: 'Article 6-9: Biometric Identification',
                user_provided: true,
                confidence: 'HIGH',
            });
            if (finalClassification !== 'UNACCEPTABLE') {
                finalClassification = 'HIGH_RISK';
            }
            requiresManualReview = true;
        }
    }

    // Article 21: Employment
    const hasEmploymentArticle = preliminaryArticles.some(a => a.article.includes('21'));

    if (hasEmploymentArticle) {
        if (answers.uses_for_hiring === 'final_decisions' || answers.uses_for_hiring === 'screening') {
            // System IS used for hiring - check mitigations
            if (answers.candidates_informed === 'no') {
                evidenceItems.push({
                    category: 'ISSUE: Missing Transparency',
                    description: 'System used for hiring but candidates NOT informed about AI involvement',
                    supports_classification: 'ESCALATES_RISK',
                    regulatory_reference: 'Article 21: Employment Decisions',
                    user_provided: true,
                    confidence: 'HIGH',
                    action_item: 'REQUIRED: Inform candidates about AI involvement',
                });
                finalClassification = 'HIGH_RISK';
                requiresManualReview = true;
                escalationReason = 'Hiring system without candidate transparency';
            }

            if (answers.hiring_appeal_process === 'no') {
                evidenceItems.push({
                    category: 'ISSUE: Missing Appeal Rights',
                    description: 'Candidates cannot appeal automated hiring decisions',
                    supports_classification: 'ESCALATES_RISK',
                    regulatory_reference: 'Article 21: Right to human review',
                    user_provided: true,
                    confidence: 'HIGH',
                    action_item: 'REQUIRED: Implement appeal/review mechanism',
                });
                if (finalClassification !== 'UNACCEPTABLE') {
                    finalClassification = 'HIGH_RISK';
                }
                requiresManualReview = true;
            }

            // Add as verified article
            finalMatchedArticles.push({
                article: 'Article 21',
                category: 'Employment Decisions',
                verified: true,
                requirements: [
                    'Inform candidates about AI involvement',
                    'Provide right to human review',
                    'Document decision-making criteria',
                    'Implement bias testing',
                ],
                user_confirmed_measures: answers.candidates_informed === 'yes' ? ['Candidate notification'] : [],
            });

        } else if (answers.uses_for_hiring === 'no') {
            // NOT used for hiring - Article 21 doesn't apply
            evidenceItems.push({
                category: 'Article 21 Verification',
                description: 'System is NOT used for hiring decisions. Article 21 (Employment) does not apply.',
                supports_classification: finalClassification,
                user_provided: true,
                confidence: 'HIGH',
            });
        }
    }

    // Article 22: Essential Services
    const hasEssentialServicesArticle = preliminaryArticles.some(a => a.article.includes('22'));

    if (hasEssentialServicesArticle) {
        if (answers.financial_decisions && answers.financial_decisions !== 'no') {
            if (answers.financial_transparency === 'no') {
                evidenceItems.push({
                    category: 'ISSUE: Missing Financial Transparency',
                    description: 'Financial decisions made without informing individuals',
                    supports_classification: 'ESCALATES_RISK',
                    regulatory_reference: 'Article 22: Essential Services',
                    user_provided: true,
                    confidence: 'HIGH',
                    action_item: 'REQUIRED: Inform individuals about AI in financial decisions',
                });
                if (finalClassification !== 'UNACCEPTABLE') {
                    finalClassification = 'HIGH_RISK';
                }
                requiresManualReview = true;
            }
        } else if (answers.financial_decisions === 'no') {
            evidenceItems.push({
                category: 'Article 22 Verification',
                description: 'System is NOT used for credit/insurance/benefits decisions. Article 22 does not apply.',
                supports_classification: finalClassification,
                user_provided: true,
                confidence: 'HIGH',
            });
        }
    }

    // ========================================
    // STEP 4: Process LIMITED_RISK Articles
    // ========================================

    // Article 39: Code Generation
    const hasCodeGenArticle = preliminaryArticles.some(a => a.article.includes('39'));

    if (hasCodeGenArticle) {
        if (answers.output_labeling === 'clearly_labeled') {
            evidenceItems.push({
                category: 'Transparency Measures',
                description: 'AI-generated outputs are clearly labeled and users are informed',
                supports_classification: 'LIMITED_RISK',
                regulatory_reference: 'Article 39 Requirements',
                user_provided: true,
                confidence: 'HIGH',
            });
        } else if (answers.output_labeling === 'not_informed') {
            evidenceItems.push({
                category: 'ISSUE: Missing Output Labeling',
                description: 'Users are not informed that outputs are AI-generated',
                supports_classification: 'ESCALATES_RISK',
                user_provided: true,
                confidence: 'HIGH',
                action_item: 'RECOMMENDED: Label AI-generated outputs',
            });
        }

        if (answers.quality_monitoring === 'comprehensive') {
            evidenceItems.push({
                category: 'Quality Monitoring',
                description: 'Comprehensive testing procedures in place for generated content',
                supports_classification: 'LIMITED_RISK',
                user_provided: true,
                confidence: 'HIGH',
            });
        }

        finalMatchedArticles.push({
            article: 'Article 39',
            category: 'Code Generation Systems',
            verified: true,
            requirements: [
                'Inform users that outputs are AI-generated',
                'Implement transparency statement',
                'Allow user opt-out',
                'Monitor for misuse',
            ],
            user_confirmed_measures: [
                ...(answers.output_labeling === 'clearly_labeled' ? ['Output labeling'] : []),
                ...(answers.ai_disable_option === 'yes' ? ['User opt-out available'] : []),
                ...(answers.quality_monitoring === 'comprehensive' ? ['Quality monitoring'] : []),
            ],
        });
    }

    // ========================================
    // STEP 5: Check Safety & Oversight
    // ========================================

    const hasHumanOversight = answers.human_oversight === 'always_review' ||
        answers.human_oversight === 'exceptions';
    const hasTesting = answers.testing_procedure === 'comprehensive' ||
        answers.testing_procedure === 'basic';
    const hasTransparency = answers.transparency_statement === 'published';

    if (hasHumanOversight) {
        evidenceItems.push({
            category: 'Safety Controls',
            description: 'Human oversight is in place for AI decisions',
            supports_classification: finalClassification,
            user_provided: true,
            confidence: 'HIGH',
        });
    }

    if (hasTesting) {
        evidenceItems.push({
            category: 'Testing & Validation',
            description: 'Testing/validation procedures are documented',
            supports_classification: finalClassification,
            user_provided: true,
            confidence: answers.testing_procedure === 'comprehensive' ? 'HIGH' : 'MEDIUM',
        });
    }

    // ========================================
    // STEP 6: Check for MINIMAL_RISK Issues
    // ========================================

    if (finalClassification === 'MINIMAL_RISK') {
        if (!hasTesting || !hasHumanOversight) {
            finalClassification = 'LIMITED_RISK';
            evidenceItems.push({
                category: 'Risk Elevation',
                description: 'System lacks comprehensive testing or human oversight - classified as LIMITED_RISK',
                supports_classification: 'LIMITED_RISK',
                user_provided: true,
                confidence: 'MEDIUM',
            });
        }
    }

    const hasArchitectureDiagram = !!answers.architecture_diagram;
    const hasHumanPolicy = !!answers.human_oversight_policy;
    const hasDataPolicy = !!answers.data_governance_policy;

    if (hasArchitectureDiagram) {
        evidenceItems.push({
            category: 'Verified Evidence: Architecture Diagram',
            description: 'System architecture diagram uploaded to secure storage.',
            supports_classification: finalClassification,
            user_provided: true,
            confidence: 'HIGH',
        });
    }

    if (hasHumanPolicy) {
        evidenceItems.push({
            category: 'Verified Evidence: Human Oversight Policy',
            description: 'Human-in-the-loop oversight policy uploaded to secure storage.',
            supports_classification: finalClassification,
            user_provided: true,
            confidence: 'HIGH',
        });
    }

    if (hasDataPolicy) {
        evidenceItems.push({
            category: 'Verified Evidence: Data Governance Policy',
            description: 'Data collection and privacy measures policy uploaded to secure storage.',
            supports_classification: finalClassification,
            user_provided: true,
            confidence: 'HIGH',
        });
    }

    // ========================================
    // STEP 7: Calculate Compliance Readiness
    // ========================================

    const complianceReadiness = calculateComplianceReadiness(
        finalClassification,
        answers,
        preliminaryArticles,
        hasHumanOversight,
        hasTesting,
        hasTransparency,
        hasArchitectureDiagram,
        hasHumanPolicy,
        hasDataPolicy
    );

    // ========================================
    // STEP 8: Build Context Summary
    // ========================================

    const contextSummary: ContextSummary = {
        intended_use: intendedUse,
        target_users: targetUsers,
        deployment_region: getReadableValue(answers.deployment_region, {
            'eu_only': 'European Union',
            'uk_only': 'United Kingdom',
            'us_only': 'United States',
            'global': 'Global (including EU)',
            'other': 'Other regions',
        }),
        has_human_oversight: hasHumanOversight,
        has_testing_procedure: hasTesting,
        has_transparency_statement: hasTransparency,
        has_appeal_mechanism: answers.error_procedure === 'documented' ||
            answers.hiring_appeal_process === 'yes' ||
            answers.financial_human_review === 'yes',
        has_data_safeguards: answers.data_protection === 'comprehensive' ||
            answers.data_protection === 'basic',
        has_architecture_diagram: hasArchitectureDiagram,
        has_human_policy_document: hasHumanPolicy,
        has_data_policy_document: hasDataPolicy,
        purpose_mismatch: mismatchCheck.has_mismatch,
        purpose_mismatch_reason: mismatchCheck.reason,
    };

    // ========================================
    // STEP 9: Determine Approval Status
    // ========================================

    const approvedForReport =
        finalClassification !== 'UNACCEPTABLE' &&
        !requiresManualReview &&
        complianceReadiness.overall_readiness !== 'NON_COMPLIANCE' &&
        !mismatchCheck.has_mismatch;

    // ========================================
    // STEP 10: Generate Final Narrative
    // ========================================

    const finalNarrative = generateNarrative(
        finalClassification,
        preliminaryArticles,
        contextSummary,
        evidenceItems,
        complianceReadiness
    );

    // ========================================
    // STEP 11: Calculate Final Score
    // ========================================

    const finalScore = calculateFinalScore(
        finalClassification,
        contextSummary,
        complianceReadiness
    );

    return {
        final_risk_classification: finalClassification,
        final_risk_score: finalScore,
        final_narrative: finalNarrative,
        context_verified: true,
        context_summary: contextSummary,
        evidence_items: evidenceItems,
        final_matched_articles: finalMatchedArticles,
        unresolved_risk_indicators: unresolvedIndicators,
        escalation_reason: escalationReason,
        compliance_readiness: complianceReadiness,
        approved_for_report: approvedForReport,
        requires_manual_review: requiresManualReview,
    };
}

/**
 * Calculate compliance readiness
 */
function calculateComplianceReadiness(
    classification: RiskClassification,
    answers: ContextAnswers,
    articles: PreliminaryArticle[],
    hasOversight: boolean,
    hasTesting: boolean,
    hasTransparency: boolean,
    hasArchitectureDiagram: boolean,
    hasHumanPolicy: boolean,
    hasDataPolicy: boolean
): ComplianceReadiness {
    const requirementsMet: string[] = [];
    const requirementsPending: string[] = [];
    const actionItems: string[] = [];

    // Base requirements
    requirementsMet.push('Risk classification verified');
    requirementsMet.push('Context verified via questionnaire');

    // Check oversight
    if (hasOversight) {
        requirementsMet.push('Human oversight in place');
    } else {
        requirementsPending.push('Human oversight implementation');
        actionItems.push('Implement human review for AI decisions');
    }

    // Check testing
    if (hasTesting) {
        requirementsMet.push('Testing procedures documented');
    } else {
        requirementsPending.push('Testing procedure documentation');
        actionItems.push('Document testing and validation procedures');
    }

    // Check transparency
    if (hasTransparency) {
        requirementsMet.push('Transparency statement published');
    } else {
        requirementsPending.push('Transparency statement implementation');
        actionItems.push('Implement and publish transparency statement');
    }

    // Check evidence uploads
    if (hasArchitectureDiagram) {
        requirementsMet.push('System Architecture Diagram verified');
    } else {
        requirementsPending.push('System Architecture Diagram');
        actionItems.push('Upload System Architecture Diagram');
    }

    if (hasHumanPolicy) {
        requirementsMet.push('Human Oversight Policy verified');
    } else {
        requirementsPending.push('Human Oversight Policy');
        actionItems.push('Upload Human Oversight Policy document');
    }

    if (hasDataPolicy) {
        requirementsMet.push('Data Governance Policy verified');
    } else {
        requirementsPending.push('Data Governance Policy');
        actionItems.push('Upload Data Governance Policy document');
    }

    // Article-specific requirements
    const hasArticle39 = articles.some(a => a.article.includes('39'));
    if (hasArticle39) {
        if (answers.output_labeling === 'clearly_labeled') {
            requirementsMet.push('AI outputs clearly labeled');
        } else {
            requirementsPending.push('AI output labeling');
            actionItems.push('Label all AI-generated outputs');
        }
    }

    // Determine overall readiness
    let overallReadiness: ComplianceReadinessLevel;

    if (classification === 'UNACCEPTABLE') {
        overallReadiness = 'NON_COMPLIANCE';
    } else if (actionItems.length === 0) {
        overallReadiness = 'FULL_COMPLIANCE';
    } else if (requirementsMet.length > 0 && classification !== 'HIGH_RISK') {
        overallReadiness = 'PARTIAL_COMPLIANCE';
    } else if (classification === 'HIGH_RISK') {
        overallReadiness = 'NEEDS_REVIEW';
    } else {
        overallReadiness = 'PARTIAL_COMPLIANCE';
    }

    return {
        overall_readiness: overallReadiness,
        requirements_met: requirementsMet,
        requirements_pending: requirementsPending,
        developer_action_items: actionItems,
    };
}

/**
 * Generate human-readable narrative
 */
function generateNarrative(
    classification: RiskClassification,
    articles: PreliminaryArticle[],
    context: ContextSummary,
    evidence: EvidenceItem[],
    compliance: ComplianceReadiness
): string {
    const lines: string[] = [];

    // Header
    lines.push(`This AI system is classified as **${classification.replace('_', ' ')}** under the EU AI Act.`);
    lines.push('');

    // Key article
    const primaryArticle = articles[0];
    if (primaryArticle) {
        lines.push(`**Matched Article:** ${primaryArticle.article} - ${primaryArticle.category}`);
        lines.push('');
    }

    // Context
    lines.push('**System Context:**');
    lines.push(`- Purpose: ${context.intended_use}`);
    lines.push(`- Users: ${context.target_users}`);
    lines.push(`- Deployment: ${context.deployment_region}`);
    lines.push('');

    // Mitigations
    lines.push('**Compliance Measures:**');
    if (context.has_human_oversight) lines.push('[Met] Human oversight in place');
    else lines.push('[Missing] Human oversight missing');

    if (context.has_testing_procedure) lines.push('[Met] Testing procedures documented');
    else lines.push('[Missing] Testing procedures not documented');

    if (context.has_transparency_statement) lines.push('[Met] Transparency statement published');
    else lines.push('[Pending] Transparency statement pending');
    lines.push('');

    // Evidence
    lines.push('**Verified Evidence:**');
    if (context.has_architecture_diagram) lines.push('[Met] Architecture diagram provided');
    if (context.has_human_policy_document) lines.push('[Met] Human oversight policy provided');
    if (context.has_data_policy_document) lines.push('[Met] Data governance policy provided');
    if (!context.has_architecture_diagram && !context.has_human_policy_document && !context.has_data_policy_document) {
        lines.push('[Pending] No documents uploaded to evidence vault');
    }
    lines.push('');

    // Compliance status
    lines.push(`**Compliance Status:** ${compliance.overall_readiness.replace('_', ' ')}`);

    if (compliance.developer_action_items.length > 0) {
        lines.push('');
        lines.push('**Action Items:**');
        compliance.developer_action_items.forEach(item => {
            lines.push(`- ${item}`);
        });
    }

    return lines.join('\n');
}

/**
 * Calculate final risk score
 */
function calculateFinalScore(
    classification: RiskClassification,
    context: ContextSummary,
    compliance: ComplianceReadiness
): number {
    let score = 0;

    // Base score by classification
    switch (classification) {
        case 'UNACCEPTABLE': score = 100; break;
        case 'HIGH_RISK': score = 75; break;
        case 'LIMITED_RISK': score = 45; break;
        case 'MINIMAL_RISK': score = 15; break;
    }

    // Adjust for mitigations
    if (context.has_human_oversight) score -= 5;
    if (context.has_testing_procedure) score -= 5;
    if (context.has_transparency_statement) score -= 5;
    if (context.has_appeal_mechanism) score -= 3;
    if (context.has_data_safeguards) score -= 2;

    // Adjust for verified evidence (-2 per document)
    if (context.has_architecture_diagram) score -= 2;
    if (context.has_human_policy_document) score -= 2;
    if (context.has_data_policy_document) score -= 2;

    // Adjust for pending items
    score += compliance.developer_action_items.length * 3;

    // Ensure bounds
    return Math.min(100, Math.max(0, score));
}

/**
 * Helper: Get readable value from answer
 */
function getReadableValue(value: string | undefined, mapping: Record<string, string>): string {
    if (!value) return 'Not specified';
    return mapping[value] || value;
}

/**
 * Phase 4: Detect mismatches between declared purpose and context answers
 */
export function detectPurposeMismatch(
    declaredPurpose: string | null | undefined, 
    answers: Record<string, any>
): { has_mismatch: boolean; reason?: string } {
    if (!declaredPurpose || declaredPurpose === 'general') return { has_mismatch: false };
    
    // Check if declared non-HR but answers say it's for hiring
    if (declaredPurpose !== 'hr_recruitment' && answers.uses_for_hiring === 'yes') {
        return { has_mismatch: true, reason: 'Declared purpose is not HR/Recruitment, but context indicates use for hiring decisions.' };
    }

    // Check if declared non-Finance but answers say it's for credit/loans
    if (declaredPurpose !== 'financial_services' && answers.financial_decisions === 'yes') {
        return { has_mismatch: true, reason: 'Declared purpose is not Financial Services, but context indicates use for financial/credit decisions.' };
    }

    // Check if non-biometrics, but uses biometrics
    if (declaredPurpose !== 'biometrics' && answers.uses_biometrics === 'yes') {
        // Warning: This could be valid (e.g., healthcare with biometrics), but we should flag manual review
        return { has_mismatch: true, reason: 'System uses biometrics but purpose is not explicitly Biometrics (ensure Annex III constraints are met).' };
    }

    // Check if developer tool but public access
    if (declaredPurpose === 'developer_tool' && answers.primary_users === 'public') {
        return { has_mismatch: true, reason: 'Developer tool intended for public/consumer use rather than developers.' };
    }

    return { has_mismatch: false };
}

