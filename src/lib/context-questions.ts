/**
 * Context Questions Generator
 * 
 * Generates dynamic questionnaire based on preliminary risk assessment
 */

import { RiskAssessment } from '@prisma/client';

export type QuestionType = 'multiple_choice' | 'boolean' | 'text' | 'file_upload';

export interface QuestionOption {
    value: string;
    label: string;
    riskImpact?: 'escalates' | 'mitigates' | 'neutral';
}

export interface Question {
    id: string;
    question: string;
    type: QuestionType;
    options?: QuestionOption[];
    required: boolean;
    helpText?: string;
}

export interface QuestionSet {
    set_id: string;
    title: string;
    description?: string;
    required: boolean;
    questions: Question[];
}

// =====================================================
// QUESTION DEFINITIONS
// =====================================================

// Question Set 1: Use Case (Always Asked)
const USE_CASE_QUESTIONS: QuestionSet = {
    set_id: 'use_case',
    title: 'Use Case Questions',
    description: 'Tell us how this AI system is used',
    required: true,
    questions: [
        {
            id: 'primary_purpose',
            question: 'What is the primary purpose of this AI system?',
            type: 'multiple_choice',
            options: [
                { value: 'code_generation', label: 'Code generation / development assistance', riskImpact: 'neutral' },
                { value: 'content_recommendation', label: 'Content recommendation', riskImpact: 'neutral' },
                { value: 'data_analysis', label: 'Data analysis / insights', riskImpact: 'neutral' },
                { value: 'image_video_processing', label: 'Image/video processing', riskImpact: 'neutral' },
                { value: 'decision_support', label: 'Decision support (hiring, lending, etc.)', riskImpact: 'escalates' },
                { value: 'safety_critical', label: 'Safety-critical function (autonomous vehicle, etc.)', riskImpact: 'escalates' },
                { value: 'other', label: 'Other', riskImpact: 'neutral' },
            ],
            required: true,
        },
        {
            id: 'primary_users',
            question: 'Who are the primary users?',
            type: 'multiple_choice',
            options: [
                { value: 'developers', label: 'Software developers', riskImpact: 'neutral' },
                { value: 'analysts', label: 'Business analysts', riskImpact: 'neutral' },
                { value: 'hr_managers', label: 'HR/Hiring managers', riskImpact: 'escalates' },
                { value: 'financial', label: 'Financial analysts / loan officers', riskImpact: 'escalates' },
                { value: 'law_enforcement', label: 'Law enforcement / government', riskImpact: 'escalates' },
                { value: 'general_public', label: 'General public / consumers', riskImpact: 'neutral' },
                { value: 'other', label: 'Other', riskImpact: 'neutral' },
            ],
            required: true,
        },
        {
            id: 'autonomous_decisions',
            question: 'Does this system make autonomous decisions that affect users?',
            type: 'multiple_choice',
            options: [
                { value: 'no', label: 'No - it only provides suggestions/information', riskImpact: 'mitigates' },
                { value: 'yes_automated', label: 'Yes - decisions are fully automated', riskImpact: 'escalates' },
                { value: 'yes_human_review', label: 'Yes - but humans always review/approve decisions', riskImpact: 'mitigates' },
                { value: 'unsure', label: 'Unsure', riskImpact: 'neutral' },
            ],
            required: true,
        },
    ],
};

// Question Set 2: Biometrics (Article 6-9)
const BIOMETRICS_QUESTIONS: QuestionSet = {
    set_id: 'biometrics',
    title: 'Biometric Processing (Article 6-9)',
    description: 'Questions about biometric data processing',
    required: true,
    questions: [
        {
            id: 'uses_biometrics',
            question: 'Does this system process biometric data (faces, voices, fingerprints)?',
            type: 'multiple_choice',
            options: [
                { value: 'realtime_id', label: 'Yes, real-time identification', riskImpact: 'escalates' },
                { value: 'not_id', label: 'Yes, but not for identification', riskImpact: 'neutral' },
                { value: 'no', label: 'No, system doesn\'t use biometrics', riskImpact: 'mitigates' },
                { value: 'unsure', label: 'Unsure', riskImpact: 'neutral' },
            ],
            required: true,
        },
        {
            id: 'law_enforcement_use',
            question: 'Is this system used by law enforcement?',
            type: 'boolean',
            required: true,
        },
        {
            id: 'biometric_opt_out',
            question: 'Is there an opt-out mechanism for users?',
            type: 'multiple_choice',
            options: [
                { value: 'yes', label: 'Yes', riskImpact: 'mitigates' },
                { value: 'no', label: 'No', riskImpact: 'escalates' },
                { value: 'na', label: 'N/A', riskImpact: 'neutral' },
            ],
            required: true,
        },
    ],
};

// Question Set 3: Employment (Article 21)
const EMPLOYMENT_QUESTIONS: QuestionSet = {
    set_id: 'employment',
    title: 'Employment Decisions (Article 21)',
    description: 'Questions about hiring and employment use',
    required: true,
    questions: [
        {
            id: 'uses_for_hiring',
            question: 'Is this system used for hiring or employment decisions?',
            type: 'multiple_choice',
            options: [
                { value: 'final_decisions', label: 'Yes, final hiring decisions', riskImpact: 'escalates' },
                { value: 'screening', label: 'Yes, but only for initial screening', riskImpact: 'escalates' },
                { value: 'no', label: 'No, never used for hiring', riskImpact: 'mitigates' },
                { value: 'unsure', label: 'Unsure', riskImpact: 'neutral' },
            ],
            required: true,
        },
        {
            id: 'candidates_informed',
            question: 'If used for hiring, are candidates informed AI is involved?',
            type: 'multiple_choice',
            options: [
                { value: 'yes', label: 'Yes, candidates are informed', riskImpact: 'mitigates' },
                { value: 'no', label: 'No, candidates are not informed', riskImpact: 'escalates' },
                { value: 'na', label: 'N/A (not used for hiring)', riskImpact: 'neutral' },
            ],
            required: true,
        },
        {
            id: 'hiring_appeal_process',
            question: 'Is there an appeal/review process for employment decisions?',
            type: 'multiple_choice',
            options: [
                { value: 'yes', label: 'Yes, candidates can request human review', riskImpact: 'mitigates' },
                { value: 'no', label: 'No', riskImpact: 'escalates' },
                { value: 'na', label: 'N/A', riskImpact: 'neutral' },
            ],
            required: true,
        },
    ],
};

// Question Set 4: Essential Services (Article 22)
const ESSENTIAL_SERVICES_QUESTIONS: QuestionSet = {
    set_id: 'essential_services',
    title: 'Essential Services (Article 22)',
    description: 'Questions about credit, insurance, and benefits decisions',
    required: true,
    questions: [
        {
            id: 'financial_decisions',
            question: 'Is this system used for credit, insurance, or social benefits decisions?',
            type: 'multiple_choice',
            options: [
                { value: 'credit', label: 'Credit scoring / lending', riskImpact: 'escalates' },
                { value: 'insurance', label: 'Insurance premium determination', riskImpact: 'escalates' },
                { value: 'social_benefits', label: 'Social benefits eligibility', riskImpact: 'escalates' },
                { value: 'no', label: 'No, not used for these decisions', riskImpact: 'mitigates' },
            ],
            required: true,
        },
        {
            id: 'financial_transparency',
            question: 'Are individuals informed about AI involvement?',
            type: 'multiple_choice',
            options: [
                { value: 'yes', label: 'Yes', riskImpact: 'mitigates' },
                { value: 'no', label: 'No', riskImpact: 'escalates' },
                { value: 'na', label: 'N/A', riskImpact: 'neutral' },
            ],
            required: true,
        },
        {
            id: 'financial_human_review',
            question: 'Can individuals request human review?',
            type: 'multiple_choice',
            options: [
                { value: 'yes', label: 'Yes', riskImpact: 'mitigates' },
                { value: 'no', label: 'No', riskImpact: 'escalates' },
                { value: 'na', label: 'N/A', riskImpact: 'neutral' },
            ],
            required: true,
        },
    ],
};

// Question Set 5: Code Generation (Article 39)
const CODE_GENERATION_QUESTIONS: QuestionSet = {
    set_id: 'code_generation',
    title: 'Code Generation (Article 39)',
    description: 'Questions about generative AI transparency',
    required: true,
    questions: [
        {
            id: 'output_labeling',
            question: 'How are users informed about AI-generated outputs?',
            type: 'multiple_choice',
            options: [
                { value: 'clearly_labeled', label: 'Clearly labeled', riskImpact: 'mitigates' },
                { value: 'documentation', label: 'Users informed through documentation', riskImpact: 'neutral' },
                { value: 'not_informed', label: 'Users not informed', riskImpact: 'escalates' },
            ],
            required: true,
        },
        {
            id: 'ai_disable_option',
            question: 'Can users disable AI features if desired?',
            type: 'multiple_choice',
            options: [
                { value: 'yes', label: 'Yes', riskImpact: 'mitigates' },
                { value: 'partial', label: 'Partial (some controls available)', riskImpact: 'neutral' },
                { value: 'no', label: 'No', riskImpact: 'escalates' },
            ],
            required: true,
        },
        {
            id: 'quality_monitoring',
            question: 'Do you monitor for code quality/security issues?',
            type: 'multiple_choice',
            options: [
                { value: 'comprehensive', label: 'Yes, comprehensive testing', riskImpact: 'mitigates' },
                { value: 'basic', label: 'Yes, basic testing', riskImpact: 'neutral' },
                { value: 'no', label: 'No testing', riskImpact: 'escalates' },
            ],
            required: true,
        },
    ],
};

// Question Set 6: Deployment (Always Asked)
const DEPLOYMENT_QUESTIONS: QuestionSet = {
    set_id: 'deployment',
    title: 'Deployment & Geography',
    required: true,
    questions: [
        {
            id: 'deployment_region',
            question: 'Where will this system be deployed?',
            type: 'multiple_choice',
            options: [
                { value: 'eu_only', label: 'European Union only', riskImpact: 'neutral' },
                { value: 'uk_only', label: 'UK only', riskImpact: 'neutral' },
                { value: 'us_only', label: 'US only', riskImpact: 'neutral' },
                { value: 'global', label: 'Global (including EU)', riskImpact: 'neutral' },
                { value: 'other', label: 'Other', riskImpact: 'neutral' },
            ],
            required: true,
        },
        {
            id: 'operator_type',
            question: 'Who operates this system?',
            type: 'multiple_choice',
            options: [
                { value: 'individual', label: 'Individual / startup', riskImpact: 'neutral' },
                { value: 'enterprise', label: 'Large enterprise (>250 employees)', riskImpact: 'neutral' },
                { value: 'government', label: 'Government / public sector', riskImpact: 'escalates' },
                { value: 'other', label: 'Other', riskImpact: 'neutral' },
            ],
            required: true,
        },
    ],
};

// Question Set 7: Safety & Testing (Always Asked)
const SAFETY_QUESTIONS: QuestionSet = {
    set_id: 'safety',
    title: 'Safety & Oversight',
    required: true,
    questions: [
        {
            id: 'human_oversight',
            question: 'Is there human oversight of AI decisions?',
            type: 'multiple_choice',
            options: [
                { value: 'always_review', label: 'Yes, humans always review before action', riskImpact: 'mitigates' },
                { value: 'exceptions', label: 'Yes, humans review exceptions/errors', riskImpact: 'mitigates' },
                { value: 'no', label: 'No human oversight', riskImpact: 'escalates' },
                { value: 'unsure', label: 'Unsure', riskImpact: 'neutral' },
            ],
            required: true,
        },
        {
            id: 'testing_procedure',
            question: 'Is there a documented testing/validation procedure?',
            type: 'multiple_choice',
            options: [
                { value: 'comprehensive', label: 'Yes, comprehensive', riskImpact: 'mitigates' },
                { value: 'basic', label: 'Yes, basic', riskImpact: 'neutral' },
                { value: 'no', label: 'No testing documented', riskImpact: 'escalates' },
                { value: 'unsure', label: 'Unsure', riskImpact: 'neutral' },
            ],
            required: true,
        },
        {
            id: 'error_procedure',
            question: 'Is there a procedure for handling AI errors or appeals?',
            type: 'multiple_choice',
            options: [
                { value: 'documented', label: 'Yes, documented', riskImpact: 'mitigates' },
                { value: 'informal', label: 'Informal/ad-hoc', riskImpact: 'neutral' },
                { value: 'no', label: 'No procedure', riskImpact: 'escalates' },
                { value: 'unsure', label: 'Unsure', riskImpact: 'neutral' },
            ],
            required: true,
        },
    ],
};

// Question Set 8: Transparency (Always Asked)
const TRANSPARENCY_QUESTIONS: QuestionSet = {
    set_id: 'transparency',
    title: 'Transparency & Documentation',
    required: true,
    questions: [
        {
            id: 'transparency_statement',
            question: 'Is there a transparency statement explaining AI involvement?',
            type: 'multiple_choice',
            options: [
                { value: 'published', label: 'Yes, published', riskImpact: 'mitigates' },
                { value: 'in_progress', label: 'In progress', riskImpact: 'neutral' },
                { value: 'no', label: 'No', riskImpact: 'escalates' },
            ],
            required: true,
        },
        {
            id: 'support_contact',
            question: 'Are users able to contact support if they have concerns?',
            type: 'multiple_choice',
            options: [
                { value: 'clear', label: 'Yes, clear contact info', riskImpact: 'mitigates' },
                { value: 'not_prominent', label: 'Yes, but not prominent', riskImpact: 'neutral' },
                { value: 'no', label: 'No', riskImpact: 'escalates' },
            ],
            required: true,
        },
        {
            id: 'data_protection',
            question: 'Do you have data protection measures (GDPR, security)?',
            type: 'multiple_choice',
            options: [
                { value: 'comprehensive', label: 'Yes, comprehensive', riskImpact: 'mitigates' },
                { value: 'basic', label: 'Yes, basic', riskImpact: 'neutral' },
                { value: 'no', label: 'No', riskImpact: 'escalates' },
            ],
            required: true,
        },
    ],
};

// Question Set 9: Evidence Collection
const EVIDENCE_QUESTIONS: QuestionSet = {
    set_id: 'evidence',
    title: 'Evidence Collection (The Moat)',
    description: 'Upload documentation to prove your compliance claims.',
    required: false,
    questions: [
        {
            id: 'architecture_diagram',
            question: 'Upload System Architecture Diagram',
            type: 'file_upload',
            helpText: 'PDF or PNG showing data flow and model components.',
            required: false,
        },
        {
            id: 'human_oversight_policy',
            question: 'Upload Human Oversight Policy',
            type: 'file_upload',
            helpText: 'Document describing how humans intervene in loop.',
            required: false,
        },
        {
            id: 'data_governance_policy',
            question: 'Upload Data Governance Policy',
            type: 'file_upload',
            helpText: 'PDF describing data collection and privacy measures.',
            required: false,
        }
    ]
};

// =====================================================
// QUESTION GENERATOR
// =====================================================

interface MatchedArticle {
    article: string;
    category: string;
    applicable: boolean | 'conditional';
}

/**
 * Generate dynamic questions based on preliminary risk assessment
 */
export function generateContextQuestions(assessment: RiskAssessment): QuestionSet[] {
    const questionSets: QuestionSet[] = [];
    const matchedArticles = (assessment.matched_annex_iii_articles as unknown as MatchedArticle[]) || [];

    // Always include use case questions
    questionSets.push(USE_CASE_QUESTIONS);

    // Add article-specific questions based on matched articles
    for (const article of matchedArticles) {
        // Article 6-9: Biometrics
        if (article.article.includes('6') || article.article.includes('9')) {
            if (!questionSets.find(q => q.set_id === 'biometrics')) {
                questionSets.push(BIOMETRICS_QUESTIONS);
            }
        }

        // Article 21: Employment
        if (article.article.includes('21')) {
            if (!questionSets.find(q => q.set_id === 'employment')) {
                questionSets.push(EMPLOYMENT_QUESTIONS);
            }
        }

        // Article 22: Essential Services
        if (article.article.includes('22')) {
            if (!questionSets.find(q => q.set_id === 'essential_services')) {
                questionSets.push(ESSENTIAL_SERVICES_QUESTIONS);
            }
        }

        // Article 39: Code Generation
        if (article.article.includes('39')) {
            if (!questionSets.find(q => q.set_id === 'code_generation')) {
                questionSets.push(CODE_GENERATION_QUESTIONS);
            }
        }
    }

    // Dynamic Questions (Feature 7)
    const tailoredQs = (assessment.tailored_questions as unknown as { id: string; question: string; type: string }[]) || [];

    if (tailoredQs.length > 0) {
        questionSets.push({
            set_id: 'tailored_verification',
            title: 'Product-Specific Verification',
            description: 'Questions tailored to your specific codebase and AI capabilities.',
            required: true,
            questions: tailoredQs.map(q => ({
                id: q.id,
                question: q.question,
                type: 'boolean', // Force boolean for consistency in MVP
                required: true,
            }))
        });
    }

    // Always include deployment, safety, and transparency
    questionSets.push(DEPLOYMENT_QUESTIONS);
    questionSets.push(SAFETY_QUESTIONS);
    questionSets.push(TRANSPARENCY_QUESTIONS);
    questionSets.push(EVIDENCE_QUESTIONS);

    return questionSets;
}

/**
 * Get all question IDs for validation
 */
export function getAllQuestionIds(questionSets: QuestionSet[]): string[] {
    return questionSets.flatMap(set => set.questions.map(q => q.id));
}
