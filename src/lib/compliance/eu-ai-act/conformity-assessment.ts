/**
 * Conformity Assessment Pathway Tracker
 * 
 * Maps risk classification + Annex III category to the correct EU AI Act
 * conformity assessment procedure (Modules A, B+C, D, F).
 * 
 * Source: Regulation (EU) 2024/1689
 * - Article 43: Conformity assessment for high-risk AI systems
 * - Article 6(1): AI systems embedded in regulated products
 * - Annex VI: Module A (internal control) 
 * - Annex VII: Module B (EU-type examination) + Module C (conformity to type)
 * - Annex VIII: Module D (quality management) / Module F (individual verification)
 * 
 * ADDITIVE ONLY: Standalone module, does not modify any existing code.
 */

// =============================================================================
// TYPES
// =============================================================================

export type AssessmentModule = 'MODULE_A' | 'MODULE_B_C' | 'MODULE_D' | 'MODULE_F' | 'NOT_REQUIRED';
export type StepStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
export type PathwayStatus = 'not_started' | 'in_progress' | 'completed' | 'needs_review';

export interface ConformityStep {
    step_id: string;
    order: number;
    title: string;
    description: string;
    article_reference: string;
    requirements: string[];
    deliverables: string[];
    estimated_duration: string;
    requires_notified_body: boolean;
    status: StepStatus;
    article_url?: string;
    evidence_required: boolean;
    evidence_ids: string[];
}

export interface ConformityPathway {
    applicable_module: AssessmentModule;
    module_name: string;
    module_description: string;
    legal_basis: string;
    requires_notified_body: boolean;
    self_assessment_eligible: boolean;
    steps: ConformityStep[];
    total_steps: number;
    estimated_timeline: string;
    annex_iii_category?: number;
    risk_classification: string;
    gpai_deployer: boolean;
    notes: string[];
}

// =============================================================================
// ANNEX III CATEGORY MAPPING
// =============================================================================

/**
 * Annex III categories that require Notified Body involvement (Article 43(1))
 * These CANNOT use Module A (internal control) self-assessment.
 * 
 * Per Article 43(1): "biometrics" (Annex III point 1) always requires
 * Notified Body unless harmonized standards are fully applied.
 */
const NOTIFIED_BODY_REQUIRED_CATEGORIES = [
    'biometric', 'biometrics', 'biometric identification',
    'remote biometric identification', 'emotion recognition',
    'biometric categorisation'
];

/**
 * Map Annex III article numbers to category descriptions
 */
const ANNEX_III_CATEGORIES: Record<number, string> = {
    1: 'Biometrics (remote identification, emotion recognition, categorisation)',
    2: 'Critical Infrastructure (energy, transport, water, digital)',
    3: 'Education & Vocational Training (admissions, assessment, proctoring)',
    4: 'Employment & Workers Management (recruitment, evaluation, monitoring)',
    5: 'Essential Services Access (credit scoring, benefits, emergency dispatch)',
    6: 'Law Enforcement (risk assessment, polygraphs, evidence evaluation)',
    7: 'Migration & Border Control (risk assessment, document verification)',
    8: 'Administration of Justice (judicial research, sentencing, legal analysis)',
};

// =============================================================================
// CONFORMITY ASSESSMENT STEPS BY MODULE
// =============================================================================

function getModuleASteps(): ConformityStep[] {
    return [
        {
            step_id: 'module_a_qms',
            order: 1,
            title: 'Establish Quality Management System',
            description: 'Implement and document a quality management system covering all requirements of Article 17.',
            article_reference: 'Article 17, Annex VI §2',
            requirements: [
                'Risk management system (Article 9)',
                'Data governance procedures (Article 10)',
                'Technical documentation (Article 11)',
                'Record-keeping system (Article 12)',
                'Transparency information for users (Article 13)',
                'Human oversight measures (Article 14)',
                'Accuracy, robustness, cybersecurity (Article 15)',
            ],
            deliverables: ['Quality Management System documentation', 'Process procedures manual'],
            estimated_duration: '4-8 weeks',
            requires_notified_body: false,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/article/17/',
            evidence_required: true,
            evidence_ids: [],
        },
        {
            step_id: 'module_a_tech_docs',
            order: 2,
            title: 'Prepare Technical Documentation',
            description: 'Create comprehensive technical documentation per Annex IV requirements.',
            article_reference: 'Article 11, Annex IV',
            requirements: [
                'General description of the AI system',
                'Detailed development process description',
                'Monitoring, functioning and control information',
                'Risk management documentation',
                'Description of changes throughout lifecycle',
                'Performance metrics and benchmarks',
                'Data requirements and data sheets',
            ],
            deliverables: ['Technical Documentation Package (Annex IV)'],
            estimated_duration: '3-6 weeks',
            requires_notified_body: false,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/article/11/',
            evidence_required: true,
            evidence_ids: [],
        },
        {
            step_id: 'module_a_testing',
            order: 3,
            title: 'Testing & Validation',
            description: 'Conduct testing to verify the AI system meets requirements. Define testing methodology, datasets, and acceptance criteria.',
            article_reference: 'Article 9(7), Annex VI §3',
            requirements: [
                'Pre-defined testing methodology',
                'Appropriate test datasets',
                'Bias testing across demographic groups',
                'Robustness and accuracy validation',
                'Cybersecurity testing',
            ],
            deliverables: ['Test results report', 'Bias analysis report', 'Validation certificate'],
            estimated_duration: '2-4 weeks',
            requires_notified_body: false,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/article/9/',
            evidence_required: true,
            evidence_ids: [],
        },
        {
            step_id: 'module_a_declaration',
            order: 4,
            title: 'EU Declaration of Conformity',
            description: 'Draw up the EU declaration of conformity per Article 47 and affix the CE marking per Article 48.',
            article_reference: 'Articles 47-48, Annex V',
            requirements: [
                'Written EU declaration of conformity',
                'CE marking affixed to AI system',
                'Declaration kept for 10 years after placing on market',
                'Declaration available to national authorities on request',
            ],
            deliverables: ['EU Declaration of Conformity (Annex V)', 'CE Marking documentation'],
            estimated_duration: '1-2 weeks',
            requires_notified_body: false,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/article/47/',
            evidence_required: true,
            evidence_ids: [],
        },
        {
            step_id: 'module_a_registration',
            order: 5,
            title: 'EU Database Registration',
            description: 'Register the AI system in the EU public database before placing on market (Article 49).',
            article_reference: 'Article 49, Article 71',
            requirements: [
                'Registration in EU AI database',
                'Provider contact details',
                'AI system description and intended purpose',
                'Risk classification information',
                'Declaration of conformity reference',
            ],
            deliverables: ['EU AI Database registration confirmation'],
            estimated_duration: '1 week',
            requires_notified_body: false,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/article/49/',
            evidence_required: false,
            evidence_ids: [],
        },
        {
            step_id: 'module_a_monitoring',
            order: 6,
            title: 'Post-Market Monitoring',
            description: 'Establish post-market monitoring system per Article 72 to collect and review experience from use.',
            article_reference: 'Articles 72-73',
            requirements: [
                'Post-market monitoring plan',
                'Systematic data collection from AI system use',
                'Procedures for incident reporting',
                'Regular system performance reviews',
            ],
            deliverables: ['Post-Market Monitoring Plan', 'Incident reporting procedure'],
            estimated_duration: 'Ongoing',
            requires_notified_body: false,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/article/72/',
            evidence_required: false,
            evidence_ids: [],
        },
    ];
}

function getModuleBCSteps(): ConformityStep[] {
    return [
        {
            step_id: 'module_bc_notified_body',
            order: 1,
            title: 'Select Notified Body',
            description: 'Identify and engage a Notified Body designated for AI Act conformity assessment under Article 28.',
            article_reference: 'Articles 28-39',
            requirements: [
                'Identify designated Notified Bodies in EU database (NANDO)',
                'Verify scope of designation covers your AI system category',
                'Submit application for EU-type examination',
            ],
            deliverables: ['Notified Body engagement letter', 'Application for EU-type examination'],
            estimated_duration: '2-4 weeks',
            requires_notified_body: true,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/article/28/',
            evidence_required: false,
            evidence_ids: [],
        },
        {
            step_id: 'module_bc_tech_docs',
            order: 2,
            title: 'Prepare Technical Documentation',
            description: 'Create complete technical documentation per Annex IV for Notified Body review.',
            article_reference: 'Annex VII §3, Annex IV',
            requirements: [
                'All Annex IV documentation requirements',
                'Source code access or adequate documentation',
                'Training and test datasets information',
                'Risk management documentation',
            ],
            deliverables: ['Technical Documentation Package (Annex IV)', 'Source code/documentation package'],
            estimated_duration: '4-8 weeks',
            requires_notified_body: true,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/annex/iv/',
            evidence_required: true,
            evidence_ids: [],
        },
        {
            step_id: 'module_bc_examination',
            order: 3,
            title: 'EU-Type Examination (Module B)',
            description: 'Notified Body examines the technical documentation and AI system, issues EU-type examination certificate if compliant.',
            article_reference: 'Annex VII §4-5',
            requirements: [
                'Notified Body assessment of technical documentation',
                'Possible testing and verification by Notified Body',
                'Demonstration of compliance with Chapter III requirements',
                'Response to any non-conformities identified',
            ],
            deliverables: ['EU-type examination certificate (or refusal with reasons)'],
            estimated_duration: '6-12 weeks',
            requires_notified_body: true,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/annex/vii/',
            evidence_required: true,
            evidence_ids: [],
        },
        {
            step_id: 'module_bc_conformity',
            order: 4,
            title: 'Conformity to Type (Module C)',
            description: 'Provider declares each AI system placed on market conforms to the approved type. Notified Body may conduct periodic checks.',
            article_reference: 'Annex VII §6',
            requirements: [
                'Internal production controls ensuring conformity to approved type',
                'Each AI system manufactured in conformity with EU-type examination certificate',
                'Periodic verification by Notified Body (if applicable)',
            ],
            deliverables: ['Conformity to type declaration', 'Production quality records'],
            estimated_duration: 'Ongoing',
            requires_notified_body: true,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/annex/vii/',
            evidence_required: true,
            evidence_ids: [],
        },
        {
            step_id: 'module_bc_declaration',
            order: 5,
            title: 'EU Declaration of Conformity & Registration',
            description: 'Issue declaration of conformity referencing EU-type examination certificate and register in EU database.',
            article_reference: 'Articles 47-49, Annex V',
            requirements: [
                'EU declaration of conformity citing EU-type examination certificate',
                'CE marking affixed',
                'EU AI database registration',
            ],
            deliverables: ['EU Declaration of Conformity', 'CE Marking', 'EU Database registration'],
            estimated_duration: '1-2 weeks',
            requires_notified_body: false,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/article/47/',
            evidence_required: true,
            evidence_ids: [],
        },
        {
            step_id: 'module_bc_monitoring',
            order: 6,
            title: 'Post-Market Monitoring',
            description: 'Establish post-market monitoring system per Article 72.',
            article_reference: 'Articles 72-73',
            requirements: [
                'Post-market monitoring plan',
                'Incident reporting procedures',
                'Regular performance reviews',
                'Reporting to Notified Body on substantial changes',
            ],
            deliverables: ['Post-Market Monitoring Plan'],
            estimated_duration: 'Ongoing',
            requires_notified_body: false,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/article/72/',
            evidence_required: false,
            evidence_ids: [],
        },
    ];
}

function getNotRequiredSteps(): ConformityStep[] {
    return [
        {
            step_id: 'not_required_transparency',
            order: 1,
            title: 'Transparency Obligations (if applicable)',
            description: 'For limited-risk AI systems: ensure users are informed they are interacting with AI (Article 50).',
            article_reference: 'Article 50',
            requirements: [
                'Inform users they are interacting with AI (chatbots, deepfakes, emotion recognition)',
                'Mark AI-generated content appropriately',
            ],
            deliverables: ['Transparency notice/disclosure'],
            estimated_duration: '1 week',
            requires_notified_body: false,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/article/50/',
            evidence_required: false,
            evidence_ids: [],
        },
        {
            step_id: 'not_required_best_practices',
            order: 2,
            title: 'Voluntary Best Practices',
            description: 'While no formal conformity assessment is required, follow voluntary codes of conduct (Article 95).',
            article_reference: 'Article 95',
            requirements: [
                'Consider voluntary codes of conduct',
                'Implement proportionate risk management',
            ],
            deliverables: ['Internal AI governance documentation (recommended)'],
            estimated_duration: 'Optional',
            requires_notified_body: false,
            status: 'not_started',
            article_url: 'https://artificialintelligenceact.eu/article/95/',
            evidence_required: false,
            evidence_ids: [],
        },
    ];
}

// =============================================================================
// CLASSIFICATION LOGIC
// =============================================================================

/**
 * Determine if the Annex III category requires a Notified Body
 * (i.e., cannot use Module A self-assessment).
 * 
 * Article 43(1): Biometrics (point 1 of Annex III) — Notified Body required
 * unless provider has applied harmonized standards covering ALL requirements
 * AND the Notified Body has verified this.
 */
function requiresNotifiedBody(matchedArticles: MatchedArticleInput[]): boolean {
    const categories = matchedArticles.map(a => a.category?.toLowerCase() || '');
    return categories.some(cat =>
        NOTIFIED_BODY_REQUIRED_CATEGORIES.some(bio => cat.includes(bio))
    );
}

/**
 * Extract annex III category number from matched articles
 */
function getAnnexIIICategory(matchedArticles: MatchedArticleInput[]): number | undefined {
    for (const article of matchedArticles) {
        // Try to extract number from article string like "Annex III, §1" or "Annex III(1)"
        const match = article.article?.match(/annex\s*iii.*?(\d+)/i)
            || article.category?.match(/(?:category|point)\s*(\d+)/i);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num >= 1 && num <= 8) return num;
        }
    }
    return undefined;
}

interface MatchedArticleInput {
    article?: string;
    category?: string;
    description?: string;
    riskTier?: string;
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Determine the conformity assessment pathway for an AI system
 * based on its risk classification and matched Annex III articles.
 * 
 * @param riskClassification - The risk tier from risk-classifier.ts
 * @param matchedArticles - Matched Annex III articles from the risk assessment
 * @param isGpaiDeployer - Whether the system deploys GPAI models
 * @returns ConformityPathway with steps and requirements
 */
export function determineConformityPathway(
    riskClassification: string,
    matchedArticles: MatchedArticleInput[],
    isGpaiDeployer: boolean = false,
): ConformityPathway {
    const annexCategory = getAnnexIIICategory(matchedArticles);
    const notes: string[] = [];

    // ─── UNACCEPTABLE ───
    if (riskClassification === 'UNACCEPTABLE') {
        return {
            applicable_module: 'NOT_REQUIRED',
            module_name: 'Prohibited',
            module_description: 'This AI system is classified as UNACCEPTABLE under Article 5 and is prohibited. No conformity assessment is possible — the system cannot be placed on the EU market.',
            legal_basis: 'Article 5 (Prohibited AI Practices)',
            requires_notified_body: false,
            self_assessment_eligible: false,
            steps: [],
            total_steps: 0,
            estimated_timeline: 'N/A — System is prohibited',
            risk_classification: riskClassification,
            gpai_deployer: isGpaiDeployer,
            notes: ['This AI practice is BANNED under the EU AI Act. It cannot be placed on or used in the EU market.'],
        };
    }

    // ─── MINIMAL_RISK or LIMITED_RISK ───
    if (riskClassification === 'MINIMAL_RISK' || riskClassification === 'LIMITED_RISK') {
        if (isGpaiDeployer) {
            notes.push('As a GPAI deployer, Article 50 transparency obligations apply from 2 August 2026.');
        }
        if (riskClassification === 'LIMITED_RISK') {
            notes.push('Article 50 transparency obligations: users must be informed they interact with AI.');
        }

        return {
            applicable_module: 'NOT_REQUIRED',
            module_name: 'No Conformity Assessment Required',
            module_description: `${riskClassification === 'LIMITED_RISK' ? 'Limited' : 'Minimal'}-risk AI systems are not subject to formal conformity assessment. Transparency obligations under Article 50 may apply.`,
            legal_basis: riskClassification === 'LIMITED_RISK' ? 'Article 50 (Transparency)' : 'No specific obligations',
            requires_notified_body: false,
            self_assessment_eligible: false,
            steps: getNotRequiredSteps(),
            total_steps: getNotRequiredSteps().length,
            estimated_timeline: '1-2 weeks (transparency measures only)',
            risk_classification: riskClassification,
            gpai_deployer: isGpaiDeployer,
            notes,
        };
    }

    // ─── HIGH_RISK ───
    if (riskClassification === 'HIGH_RISK') {
        const needsNotifiedBody = requiresNotifiedBody(matchedArticles);

        if (needsNotifiedBody) {
            // Module B+C: Biometrics or systems without harmonized standards
            notes.push('Annex III point 1 (biometrics) requires Notified Body involvement per Article 43(1).');
            notes.push('The provider may use harmonized standards to simplify the assessment, but Notified Body verification is still required.');

            if (isGpaiDeployer) {
                notes.push('Additional GPAI deployer obligations under Article 50 apply from 2 August 2026.');
            }

            const steps = getModuleBCSteps();
            return {
                applicable_module: 'MODULE_B_C',
                module_name: 'Module B + C (EU-Type Examination)',
                module_description: 'Third-party conformity assessment requiring a Notified Body. The Notified Body examines the technical design (Module B) and verifies each system conforms to the approved type (Module C).',
                legal_basis: 'Article 43(1), Annex VII',
                requires_notified_body: true,
                self_assessment_eligible: false,
                steps,
                total_steps: steps.length,
                estimated_timeline: '16-32 weeks',
                annex_iii_category: annexCategory,
                risk_classification: riskClassification,
                gpai_deployer: isGpaiDeployer,
                notes,
            };
        } else {
            // Module A: Internal control (self-assessment)
            notes.push('Self-assessment permitted for Annex III categories 2-8 when harmonized standards or common specifications are applied.');
            notes.push('The provider must still comply with all Chapter III requirements and maintain complete technical documentation.');

            if (isGpaiDeployer) {
                notes.push('Additional GPAI deployer obligations under Article 50 apply from 2 August 2026.');
            }

            const steps = getModuleASteps();
            return {
                applicable_module: 'MODULE_A',
                module_name: 'Module A (Internal Control)',
                module_description: 'Self-assessment procedure. The provider verifies compliance internally without a Notified Body. Requires full adherence to Chapter III requirements, Annex IV documentation, and Annex VI procedures.',
                legal_basis: 'Article 43(2), Annex VI',
                requires_notified_body: false,
                self_assessment_eligible: true,
                steps,
                total_steps: steps.length,
                estimated_timeline: '12-22 weeks',
                annex_iii_category: annexCategory,
                risk_classification: riskClassification,
                gpai_deployer: isGpaiDeployer,
                notes,
            };
        }
    }

    // Fallback — shouldn't normally reach here
    return {
        applicable_module: 'NOT_REQUIRED',
        module_name: 'Assessment Pending',
        module_description: 'Risk classification could not be determined. Please complete risk classification first.',
        legal_basis: 'N/A',
        requires_notified_body: false,
        self_assessment_eligible: false,
        steps: [],
        total_steps: 0,
        estimated_timeline: 'Pending classification',
        risk_classification: riskClassification,
        gpai_deployer: isGpaiDeployer,
        notes: ['Complete risk classification to determine conformity pathway.'],
    };
}

/**
 * Get human-readable description for an Annex III category number
 */
export function getAnnexIIICategoryDescription(categoryNumber: number): string {
    return ANNEX_III_CATEGORIES[categoryNumber] || `Annex III Category ${categoryNumber}`;
}

/**
 * Calculate overall completion percentage from steps
 */
export function calculateCompletionPercent(steps: ConformityStep[]): number {
    if (steps.length === 0) return 0;
    const completed = steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
}

/**
 * Get the current active step (first non-completed step)
 */
export function getCurrentStep(steps: ConformityStep[]): ConformityStep | null {
    return steps.find(s => s.status !== 'completed') || null;
}

/**
 * Get the full step definition (refreshed data) by ID
 * Used to hydrate stored steps with new static data like links
 */
export function getStepById(stepId: string): ConformityStep | undefined {
    const allSteps = [
        ...getModuleASteps(),
        ...getModuleBCSteps(),
        ...getNotRequiredSteps()
    ];
    return allSteps.find(s => s.step_id === stepId);
}
