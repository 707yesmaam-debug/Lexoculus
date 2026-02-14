/**
 * Compliance Timeline Engine
 * 
 * Calculates applicable EU AI Act deadlines based on risk classification,
 * GPAI status, and system category.
 * 
 * Source: Regulation (EU) 2024/1689, Article 113 (Entry into force and application)
 * 
 * ADDITIVE ONLY: Standalone module, does not modify any existing code.
 */

// =============================================================================
// TYPES
// =============================================================================

export type DeadlineStatus = 'passed' | 'critical' | 'upcoming' | 'future';

export interface ComplianceDeadline {
    id: string;
    date: string;           // ISO date
    title: string;
    description: string;
    article: string;
    applies_to: string[];   // Risk levels and categories
    status: DeadlineStatus;
    days_remaining: number;
    penalties?: string;
}

export interface TimelineSummary {
    total_deadlines: number;
    passed_deadlines: number;
    critical_deadlines: number;     // < 90 days
    upcoming_deadlines: number;     // 90-365 days
    future_deadlines: number;       // > 365 days
    next_deadline: ComplianceDeadline | null;
    most_urgent_action: string;
    deadlines: ComplianceDeadline[];
}

// =============================================================================
// EU AI ACT DEADLINES (Article 113, verified)
// =============================================================================

const EU_AI_ACT_DEADLINES_RAW = [
    {
        id: 'art5_prohibited',
        date: '2025-02-02',
        title: 'Prohibited AI Practices',
        description: 'Article 5 prohibitions are enforceable. Systems engaging in banned practices (social scoring, real-time biometric identification, emotion recognition in workplaces/schools, etc.) must cease operation.',
        article: 'Article 5',
        applies_to: ['UNACCEPTABLE', 'ALL'],
        penalties: 'Up to €35M or 7% global annual turnover',
    },
    {
        id: 'gpai_obligations',
        date: '2025-08-02',
        title: 'GPAI Provider Obligations',
        description: 'Obligations for providers of general-purpose AI models under Chapter V: technical documentation (Annex XI), downstream provider info (Annex XII), copyright compliance, training data summary.',
        article: 'Articles 51-55',
        applies_to: ['GPAI', 'GPAI_PROVIDER'],
        penalties: 'Up to €15M or 3% global annual turnover',
    },
    {
        id: 'governance',
        date: '2025-08-02',
        title: 'AI Office & Governance Structure',
        description: 'The EU AI Office becomes fully operational. National competent authorities must be designated. AI Pact governance structures take effect.',
        article: 'Articles 64-69',
        applies_to: ['ALL'],
    },
    {
        id: 'penalties',
        date: '2025-08-02',
        title: 'Penalty Framework Active',
        description: 'Full penalty framework enters into force. Member States must lay down rules on penalties applicable to infringements.',
        article: 'Article 99',
        applies_to: ['ALL'],
    },
    {
        id: 'high_risk_annex_iii',
        date: '2026-08-02',
        title: 'High-Risk AI System Compliance',
        description: 'Full compliance required for standalone high-risk AI systems listed in Annex III. Includes conformity assessment, EU database registration, quality management, post-market monitoring.',
        article: 'Article 6(2), Annex III',
        applies_to: ['HIGH_RISK'],
        penalties: 'Up to €15M or 3% global annual turnover',
    },
    {
        id: 'transparency',
        date: '2026-08-02',
        title: 'Transparency Obligations',
        description: 'Article 50 transparency obligations for deployers: disclosure of AI interaction, labeling of AI-generated content (deepfakes, synthetic text/audio/video), emotion recognition system notices.',
        article: 'Article 50',
        applies_to: ['LIMITED_RISK', 'GPAI_DEPLOYER', 'ALL'],
        penalties: 'Up to €15M or 3% global annual turnover',
    },
    {
        id: 'codes_of_practice',
        date: '2026-08-02',
        title: 'Codes of Practice Finalized',
        description: 'AI Office publishes final codes of practice for GPAI providers. Provides detailed guidance on compliance with Chapter V obligations.',
        article: 'Article 56',
        applies_to: ['GPAI', 'GPAI_PROVIDER', 'GPAI_DEPLOYER'],
    },
    {
        id: 'embedded_ai',
        date: '2027-08-02',
        title: 'Embedded AI in Regulated Products',
        description: 'AI systems embedded in Union harmonisation legislation products (medical devices, machinery, vehicles, toys, lifts, etc.) that serve as safety components must comply with AI Act requirements.',
        article: 'Article 6(1), Annex I',
        applies_to: ['HIGH_RISK', 'EMBEDDED_AI'],
        penalties: 'Up to €15M or 3% global annual turnover',
    },
];

// =============================================================================
// CORE LOGIC
// =============================================================================

/**
 * Calculate deadline status and days remaining from today
 */
function calculateDeadlineStatus(dateStr: string, referenceDate?: Date): { status: DeadlineStatus; daysRemaining: number } {
    const deadline = new Date(dateStr);
    const now = referenceDate || new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) return { status: 'passed', daysRemaining };
    if (daysRemaining <= 90) return { status: 'critical', daysRemaining };
    if (daysRemaining <= 365) return { status: 'upcoming', daysRemaining };
    return { status: 'future', daysRemaining };
}

/**
 * Determine which deadlines apply to the system based on classification and GPAI status
 */
function isDeadlineApplicable(
    deadline: typeof EU_AI_ACT_DEADLINES_RAW[0],
    riskClassification: string,
    isGpaiDeployer: boolean,
    isGpaiProvider: boolean,
    isEmbeddedAI: boolean,
): boolean {
    const applies = deadline.applies_to;

    // ALL applies to everyone
    if (applies.includes('ALL')) return true;

    // Direct risk level match
    if (applies.includes(riskClassification)) return true;

    // GPAI checks
    if (applies.includes('GPAI') && (isGpaiDeployer || isGpaiProvider)) return true;
    if (applies.includes('GPAI_DEPLOYER') && isGpaiDeployer) return true;
    if (applies.includes('GPAI_PROVIDER') && isGpaiProvider) return true;

    // Embedded AI
    if (applies.includes('EMBEDDED_AI') && isEmbeddedAI) return true;

    return false;
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Calculate the compliance timeline for an AI system.
 * 
 * @param riskClassification - Risk tier from risk classifier
 * @param isGpaiDeployer - Whether system deploys GPAI models
 * @param isGpaiProvider - Whether system provides GPAI models
 * @param isEmbeddedAI - Whether AI is embedded in regulated product
 * @param referenceDate - Optional reference date for testing (defaults to now)
 * @returns TimelineSummary with applicable deadlines and status
 */
export function calculateComplianceTimeline(
    riskClassification: string,
    isGpaiDeployer: boolean = false,
    isGpaiProvider: boolean = false,
    isEmbeddedAI: boolean = false,
    referenceDate?: Date,
): TimelineSummary {
    const applicableDeadlines: ComplianceDeadline[] = EU_AI_ACT_DEADLINES_RAW
        .filter(dl => isDeadlineApplicable(dl, riskClassification, isGpaiDeployer, isGpaiProvider, isEmbeddedAI))
        .map(dl => {
            const { status, daysRemaining } = calculateDeadlineStatus(dl.date, referenceDate);
            return {
                id: dl.id,
                date: dl.date,
                title: dl.title,
                description: dl.description,
                article: dl.article,
                applies_to: dl.applies_to,
                status,
                days_remaining: daysRemaining,
                penalties: dl.penalties,
            };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const passed = applicableDeadlines.filter(d => d.status === 'passed').length;
    const critical = applicableDeadlines.filter(d => d.status === 'critical').length;
    const upcoming = applicableDeadlines.filter(d => d.status === 'upcoming').length;
    const future = applicableDeadlines.filter(d => d.status === 'future').length;

    const nextDeadline = applicableDeadlines.find(d => d.status !== 'passed') || null;

    // Determine most urgent action
    let urgentAction = 'No immediate compliance action required.';
    if (critical > 0) {
        const criticalDl = applicableDeadlines.find(d => d.status === 'critical')!;
        urgentAction = `⚠️ CRITICAL: "${criticalDl.title}" deadline in ${criticalDl.days_remaining} days (${criticalDl.article}).`;
    } else if (upcoming > 0) {
        const upcomingDl = applicableDeadlines.find(d => d.status === 'upcoming')!;
        urgentAction = `"${upcomingDl.title}" deadline in ${upcomingDl.days_remaining} days (${upcomingDl.article}).`;
    } else if (passed > 0 && applicableDeadlines.length === passed) {
        urgentAction = 'All applicable deadlines have passed. Ensure ongoing compliance.';
    }

    return {
        total_deadlines: applicableDeadlines.length,
        passed_deadlines: passed,
        critical_deadlines: critical,
        upcoming_deadlines: upcoming,
        future_deadlines: future,
        next_deadline: nextDeadline,
        most_urgent_action: urgentAction,
        deadlines: applicableDeadlines,
    };
}

/**
 * Get all EU AI Act deadlines (unfiltered) for display on a timeline overview page
 */
export function getAllDeadlines(referenceDate?: Date): ComplianceDeadline[] {
    return EU_AI_ACT_DEADLINES_RAW.map(dl => {
        const { status, daysRemaining } = calculateDeadlineStatus(dl.date, referenceDate);
        return {
            id: dl.id,
            date: dl.date,
            title: dl.title,
            description: dl.description,
            article: dl.article,
            applies_to: dl.applies_to,
            status,
            days_remaining: daysRemaining,
            penalties: dl.penalties,
        };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
