import { RiskTier } from './annex-iii-articles';

// =============================================================================
// TRIPWIRE CONFIGURATION
// =============================================================================

/**
 * Files that ALWAYS trigger a Tripwire scan if modified.
 * These are the "Control Plane" of the application.
 */
export const TRIPWIRE_FILES = [
    // Dependencies
    'package.json',
    'package-lock.json',
    'requirements.txt',
    'Pipfile',
    'Pipfile.lock',
    'pyproject.toml',
    'Gemfile',
    'Gemfile.lock',
    'go.mod',
    'go.sum',
    'pom.xml',
    'build.gradle',
    'composer.json',
    'composer.lock',
    'cargo.toml',
    'cargo.lock',

    // Infrastructure / Environment
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
    'Procfile',
    'netlify.toml',
    'vercel.json',

    // AI/ML Specific
    'prompts.py',
    'prompts.ts',
    'prompts.js',
    'prompts.json',
    'model_card.md',
    'model_card.yaml',
];

/**
 * File extensions to IGNORE completely during differential scanning.
 * These files cannot technically contain "Compliance Risk" in 99% of cases.
 */
export const IGNORED_EXTENSIONS = [
    '.md', '.markdown', '.txt',
    '.css', '.scss', '.less', '.sass',
    '.html', '.htm', // Templates *might* contain risk, but usually not structural
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
    '.woff', '.woff2', '.ttf', '.eot',
    '.mp3', '.mp4', '.wav',
    '.gitignore', '.dockerignore', '.prettierrc', '.eslintrc',
    '.lock', // We check package.json, lockfiles are too noisy for diffs usually
];

/**
 * "Poor Man's Moat" - Weighted Heuristics for Risk Detection.
 * If these keywords appear in a Tripwire file or a code diff, they trigger a risk flag.
 */
export const RISK_HEURISTICS: Record<string, { risk: RiskTier; category: string; weight: number }> = {
    // UNACCEPTABLE RISKS (Banned)
    'social_scoring': { risk: 'UNACCEPTABLE', category: 'Social Scoring', weight: 100 },
    'subliminal': { risk: 'UNACCEPTABLE', category: 'Cognitive Manipulation', weight: 100 },
    'biometric_categorization': { risk: 'UNACCEPTABLE', category: 'Biometric Categorization', weight: 100 },
    'emotion_recognition': { risk: 'UNACCEPTABLE', category: 'Emotion Recognition', weight: 90 }, // Context dependent, but flags high
    'real_time_biometric': { risk: 'UNACCEPTABLE', category: 'Real-time Biometric', weight: 100 },
    'predictive_policing': { risk: 'UNACCEPTABLE', category: 'Predictive Policing', weight: 100 },

    // HIGH RISK (Annex III)
    'biometric': { risk: 'HIGH_RISK', category: 'Biometrics', weight: 80 },
    'face_recognition': { risk: 'HIGH_RISK', category: 'Biometrics', weight: 90 },
    'dlib': { risk: 'HIGH_RISK', category: 'Biometrics (Library)', weight: 60 },
    'deepface': { risk: 'HIGH_RISK', category: 'Biometrics (Library)', weight: 90 },
    'credit_score': { risk: 'HIGH_RISK', category: 'Critical Services (Finance)', weight: 80 },
    'loan_application': { risk: 'HIGH_RISK', category: 'Critical Services (Finance)', weight: 70 },
    'hiring_algorithm': { risk: 'HIGH_RISK', category: 'Employment', weight: 80 },
    'resume_screening': { risk: 'HIGH_RISK', category: 'Employment', weight: 80 },
    'surveillance': { risk: 'HIGH_RISK', category: 'Surveillance', weight: 70 },
    'critical_infrastructure': { risk: 'HIGH_RISK', category: 'Critical Infrastructure', weight: 90 },

    // LIMITED RISK (Generative AI / Chatbots)
    'openai': { risk: 'LIMITED_RISK', category: 'Generative AI', weight: 50 },
    'anthropic': { risk: 'LIMITED_RISK', category: 'Generative AI', weight: 50 },
    'cohere': { risk: 'LIMITED_RISK', category: 'Generative AI', weight: 50 },
    'huggingface': { risk: 'LIMITED_RISK', category: 'Generative AI', weight: 40 },
    'transformers': { risk: 'LIMITED_RISK', category: 'Generative AI', weight: 40 },
    'gpt-4': { risk: 'LIMITED_RISK', category: 'Generative AI', weight: 50 },
    'claude': { risk: 'LIMITED_RISK', category: 'Generative AI', weight: 50 },
    'stable_diffusion': { risk: 'LIMITED_RISK', category: 'Generative AI (Image)', weight: 50 },
    'midjourney': { risk: 'LIMITED_RISK', category: 'Generative AI (Image)', weight: 50 },
    'deepfake': { risk: 'LIMITED_RISK', category: 'Generative AI (Synthetic Content)', weight: 60 },
    'chatbot': { risk: 'LIMITED_RISK', category: 'Conversational AI', weight: 30 },
};

// =============================================================================
// TYPES
// =============================================================================

export interface TripwireResult {
    triggered: boolean;
    files_analyzed: string[];
    risk_found: boolean;
    highest_risk: RiskTier | null;
    detections: {
        file: string;
        risk: RiskTier;
        category: string;
        heuristic_match: string;
        snippet?: string;
    }[];
}

// =============================================================================
// ENGINE LOGIC
// =============================================================================

/**
 * Main function to scan a list of changed files and their diffs.
 */
export function scanDiffs(
    fileChanges: { filename: string; diff: string }[]
): TripwireResult {
    const result: TripwireResult = {
        triggered: false,
        files_analyzed: [],
        risk_found: false,
        highest_risk: null,
        detections: []
    };

    for (const change of fileChanges) {
        // 1. Check if file is interesting
        if (shouldSkipFile(change.filename)) {
            continue;
        }

        result.triggered = true;
        result.files_analyzed.push(change.filename);

        // 2. Scan the diff content for keywords
        const scanResult = scanContent(change.diff, change.filename);
        if (scanResult.length > 0) {
            result.risk_found = true;
            result.detections.push(...scanResult);
        }
    }

    // 3. Determine highest risk
    if (result.risk_found) {
        result.highest_risk = getHighestRisk(result.detections.map(d => d.risk));
    }

    return result;
}

/**
 * Helper: Should we skip this file?
 */
function shouldSkipFile(filename: string): boolean {
    // 1. Check if it's a Tripwire file (Priority 1)
    if (TRIPWIRE_FILES.includes(filename.split('/').pop() || '')) {
        return false; // Never skip tripwire files
    }

    // 2. Check extensions
    const lower = filename.toLowerCase();
    for (const ext of IGNORED_EXTENSIONS) {
        if (lower.endsWith(ext)) {
            return true;
        }
    }

    // 3. Check specific directories to ignore (e.g. tests)
    if (lower.includes('test/') || lower.includes('tests/') || lower.includes('__tests__/')) {
        return true;
    }

    return false; // Default: Don't skip (scan code files)
}

/**
 * Helper: Scan a string for risk heuristics
 */
function scanContent(content: string, filename: string) {
    const detections = [];
    const lowerContent = content.toLowerCase();

    for (const [keyword, info] of Object.entries(RISK_HEURISTICS)) {
        if (lowerContent.includes(keyword)) {
            detections.push({
                file: filename,
                risk: info.risk,
                category: info.category,
                heuristic_match: keyword,
                // Simple snippet extraction could go here
            });
        }
    }
    return detections;
}

/**
 * Helper: Rank risk tiers
 */
function getHighestRisk(risks: RiskTier[]): RiskTier {
    const order: RiskTier[] = ['UNACCEPTABLE', 'HIGH_RISK', 'LIMITED_RISK', 'MINIMAL_RISK'];
    for (const tier of order) {
        if (risks.includes(tier)) return tier;
    }
    return 'MINIMAL_RISK';
}
