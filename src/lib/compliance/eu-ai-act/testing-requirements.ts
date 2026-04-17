export interface TestingRequirement {
    id: string;
    article_reference: string;
    category: 'bias' | 'accuracy' | 'robustness' | 'cybersecurity';
    title: string;
    description: string;
    evidence_types: string[];
    required_for: string[]; // Risk Classifications
    status: 'not_started' | 'evidence_uploaded' | 'verified';
}

export const ALL_TESTING_REQUIREMENTS: TestingRequirement[] = [
    {
        id: 'req_bias_testing',
        article_reference: 'Article 10(2)(f)',
        category: 'bias',
        title: 'Bias Detection & Mitigation',
        description: 'Examine datasets and model outputs for possible biases affecting health, safety, or fundamental rights.',
        evidence_types: ['bias_report_pdf', 'fairness_metrics_csv'],
        required_for: ['HIGH_RISK'],
        status: 'not_started',
    },
    {
        id: 'req_accuracy',
        article_reference: 'Article 15(1)',
        category: 'accuracy',
        title: 'Accuracy Metrics',
        description: 'High-risk AI systems must achieve appropriate levels of accuracy and maintain them throughout their lifecycle.',
        evidence_types: ['accuracy_metrics_csv', 'test_results_pdf'],
        required_for: ['HIGH_RISK', 'LIMITED_RISK'], // Voluntary for limited risk
        status: 'not_started',
    },
    {
        id: 'req_robustness',
        article_reference: 'Article 15(4)',
        category: 'robustness',
        title: 'Technical Robustness',
        description: 'Resilience against errors, faults, and inconsistencies. Must handle feedback loops safely.',
        evidence_types: ['stress_test_report_pdf'],
        required_for: ['HIGH_RISK'],
        status: 'not_started',
    },
    {
        id: 'req_cybersecurity',
        category: 'cybersecurity',
        article_reference: 'Article 15(5)',
        title: 'Cybersecurity Assessment',
        description: 'Resilience against attempts by unauthorized third parties to alter system use or performance (e.g., data poisoning).',
        evidence_types: ['penetration_test_pdf', 'vulnerability_scan_report'],
        required_for: ['HIGH_RISK'],
        status: 'not_started',
    }
];

export function getTestingRequirements(riskClassification: string | null): TestingRequirement[] {
    if (!riskClassification || riskClassification === 'UNACCEPTABLE' || riskClassification === 'MINIMAL_RISK') {
        return [];
    }
    
    return ALL_TESTING_REQUIREMENTS.map(req => ({...req})).filter(req => 
        req.required_for.includes(riskClassification)
    );
}

export function calculateTestingProgress(requirements: TestingRequirement[]): { total: number, uploaded: number, verified: number, percent: number } {
    if (requirements.length === 0) return { total: 0, uploaded: 0, verified: 0, percent: 100 };
    
    const uploaded = requirements.filter(r => r.status === 'evidence_uploaded' || r.status === 'verified').length;
    const verified = requirements.filter(r => r.status === 'verified').length;
    
    return {
        total: requirements.length,
        uploaded,
        verified,
        percent: Math.round((uploaded / requirements.length) * 100)
    };
}
