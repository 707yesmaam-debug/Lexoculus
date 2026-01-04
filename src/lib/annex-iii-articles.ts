/**
 * EU AI Act Annex III Articles Reference
 * 
 * This file contains the static reference data for all Annex III articles
 * used in risk classification.
 */

export type RiskTier = 'UNACCEPTABLE' | 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK';

export interface AnnexIIIArticle {
    article: string;
    category: string;
    description: string;
    riskTier: RiskTier;
    requirements: string[];
    examples: string[];
}

// HIGH RISK Articles (6-27)
export const HIGH_RISK_ARTICLES: AnnexIIIArticle[] = [
    {
        article: 'Article 6-9',
        category: 'Biometric Identification & Categorization',
        description: 'Real-time and post remote biometric identification, facial recognition, emotion recognition for access control',
        riskTier: 'HIGH_RISK',
        requirements: [
            'Conformity assessment required',
            'Registration in EU database',
            'Human oversight mandatory',
            'Logging of all decisions',
        ],
        examples: [
            'Real-time facial recognition',
            'Emotion detection for access control',
            'Biometric verification systems',
            'Gait analysis for identification',
        ],
    },
    {
        article: 'Article 15',
        category: 'Critical Infrastructure Management',
        description: 'AI systems as safety components in management and operation of critical infrastructure',
        riskTier: 'HIGH_RISK',
        requirements: [
            'Risk management system',
            'Quality management system',
            'Technical documentation',
            'Conformity assessment',
        ],
        examples: [
            'Water supply management',
            'Electricity grid control',
            'Gas distribution systems',
            'Traffic management systems',
            'Railway signaling',
        ],
    },
    {
        article: 'Article 20',
        category: 'Education & Vocational Training',
        description: 'AI systems for determining access to education institutions or evaluating learning outcomes',
        riskTier: 'HIGH_RISK',
        requirements: [
            'Transparency to students',
            'Human oversight in decisions',
            'Right to explanation',
            'Non-discrimination testing',
        ],
        examples: [
            'Automated essay grading',
            'Admission decision systems',
            'Student evaluation tools',
            'Placement testing',
        ],
    },
    {
        article: 'Article 21',
        category: 'Employment & Workers Rights',
        description: 'AI systems for recruitment, promotion, termination, task allocation, or monitoring workers',
        riskTier: 'HIGH_RISK',
        requirements: [
            'Transparency to applicants/workers',
            'Human oversight mandatory',
            'Right to explanation',
            'Bias testing and mitigation',
        ],
        examples: [
            'Resume screening systems',
            'Interview scheduling AI',
            'Performance evaluation tools',
            'Termination recommendation systems',
            'Worker monitoring software',
        ],
    },
    {
        article: 'Article 22',
        category: 'Access to Essential Services',
        description: 'AI systems for creditworthiness assessment, insurance premium determination, or evaluating eligibility for social benefits',
        riskTier: 'HIGH_RISK',
        requirements: [
            'Transparency to consumers',
            'Right to explanation',
            'Human review of decisions',
            'Non-discrimination testing',
        ],
        examples: [
            'Credit scoring systems',
            'Loan approval AI',
            'Insurance risk assessment',
            'Social benefit eligibility',
            'Mortgage approval systems',
        ],
    },
    {
        article: 'Article 23',
        category: 'Law Enforcement',
        description: 'AI systems used by law enforcement for risk assessment, polygraphs, evidence evaluation, or profiling',
        riskTier: 'HIGH_RISK',
        requirements: [
            'Strict human oversight',
            'Logging of all uses',
            'Regular auditing',
            'Judicial authorization for some uses',
        ],
        examples: [
            'Predictive policing',
            'Evidence analysis tools',
            'Risk assessment for recidivism',
            'Surveillance systems',
        ],
    },
    {
        article: 'Article 24',
        category: 'Migration, Asylum & Border Control',
        description: 'AI systems for processing asylum applications, visa applications, or border control decisions',
        riskTier: 'HIGH_RISK',
        requirements: [
            'Human review of all decisions',
            'Right to appeal',
            'Transparency requirements',
            'Non-discrimination safeguards',
        ],
        examples: [
            'Visa application screening',
            'Asylum claim assessment',
            'Border security systems',
            'Document verification AI',
        ],
    },
    {
        article: 'Article 25',
        category: 'Administration of Justice',
        description: 'AI systems for interpreting facts and law, applying law to facts, or used for dispute resolution',
        riskTier: 'HIGH_RISK',
        requirements: [
            'Transparency to affected parties',
            'Human judge oversight',
            'Right to explanation',
            'Appeal mechanisms',
        ],
        examples: [
            'Legal research AI',
            'Sentencing recommendation systems',
            'Case outcome prediction',
        ],
    },
    {
        article: 'Article 26',
        category: 'Autonomous Vehicles',
        description: 'Safety components in vehicles with level 3+ automation',
        riskTier: 'HIGH_RISK',
        requirements: [
            'Type approval required',
            'Safety certification',
            'Ongoing monitoring',
            'Incident reporting',
        ],
        examples: [
            'Self-driving car systems',
            'Autonomous navigation',
            'Driver assistance (level 3+)',
        ],
    },
];

// LIMITED RISK Articles (37-40)
export const LIMITED_RISK_ARTICLES: AnnexIIIArticle[] = [
    {
        article: 'Article 37',
        category: 'Emotion Recognition Systems',
        description: 'AI systems intended to detect emotions (not for access control or criminal investigation)',
        riskTier: 'LIMITED_RISK',
        requirements: [
            'Inform users that system detects emotions',
            'Clear labeling that AI is in use',
        ],
        examples: [
            'Customer sentiment analysis',
            'Engagement detection in education',
            'Mood tracking apps',
        ],
    },
    {
        article: 'Article 38',
        category: 'Biometric Categorization Systems',
        description: 'AI systems for categorizing natural persons based on biometric data (not real-time identification)',
        riskTier: 'LIMITED_RISK',
        requirements: [
            'Inform users of biometric processing',
            'Transparency about categorization',
        ],
        examples: [
            'Age estimation',
            'Gender detection',
            'Ethnicity categorization',
        ],
    },
    {
        article: 'Article 39',
        category: 'Code Generation Systems',
        description: 'AI systems that generate synthetic content such as text, images, audio, video, or code',
        riskTier: 'LIMITED_RISK',
        requirements: [
            'Label outputs as AI-generated',
            'Inform users AI is in use',
            'Transparency statement required',
        ],
        examples: [
            'Code completion tools (Copilot)',
            'Text generation (ChatGPT)',
            'Image generation (DALL-E, Midjourney)',
            'Audio/voice synthesis',
            'Video generation',
        ],
    },
    {
        article: 'Article 40',
        category: 'Personalized Recommendations',
        description: 'AI systems providing personalized content recommendations',
        riskTier: 'LIMITED_RISK',
        requirements: [
            'Inform users of personalization',
            'Provide opt-out mechanisms',
            'Transparency about criteria',
        ],
        examples: [
            'Video recommendation engines',
            'News feed algorithms',
            'Product recommendations',
            'Content curation systems',
        ],
    },
];

// UNACCEPTABLE Risk (Banned) descriptions
export const UNACCEPTABLE_RISKS = [
    {
        category: 'Subliminal Manipulation',
        description: 'AI systems that deploy subliminal techniques to distort behavior and cause harm',
        examples: ['Hidden psychological manipulation', 'Subconscious influence systems'],
    },
    {
        category: 'Exploitation of Vulnerable Groups',
        description: 'AI systems that exploit vulnerabilities of specific groups due to age, disability, or social status',
        examples: ['Targeting children for manipulation', 'Exploiting mental conditions'],
    },
    {
        category: 'Social Scoring',
        description: 'AI systems for evaluation or classification of citizens based on social behavior or personal characteristics',
        examples: ['Citizen social credit systems', 'Public trustworthiness scoring'],
    },
    {
        category: 'Real-time Biometric Identification in Public',
        description: 'Real-time remote biometric identification in publicly accessible spaces (with narrow exceptions)',
        examples: ['Mass surveillance facial recognition', 'Public space emotion detection'],
    },
];

// Get all articles for public API
export function getAllArticles(): AnnexIIIArticle[] {
    return [...HIGH_RISK_ARTICLES, ...LIMITED_RISK_ARTICLES];
}

// Find article by category keyword
export function findArticleByCategory(keyword: string): AnnexIIIArticle | undefined {
    const allArticles = getAllArticles();
    const lowerKeyword = keyword.toLowerCase();

    return allArticles.find(article =>
        article.category.toLowerCase().includes(lowerKeyword) ||
        article.description.toLowerCase().includes(lowerKeyword)
    );
}
