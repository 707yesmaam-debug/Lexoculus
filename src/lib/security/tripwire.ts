import {
    RiskTier,
    ARTICLE_5_CONSTRAINTS,
    ANNEX_III_CONSTRAINTS,
    LIMITED_RISK_CONSTRAINTS,
    EUAIConstraint
} from '../compliance/eu-ai-act/annex-iii-articles';

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

// Combine all constraints into a single "Rulebook"
const ALL_CONSTRAINTS = [
    ...ARTICLE_5_CONSTRAINTS,
    ...ANNEX_III_CONSTRAINTS,
    ...LIMITED_RISK_CONSTRAINTS
];

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
        constraint_id: string; // Added to trace back to specific rule
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

        // 2. Scan the diff content for keywords defined in our Rulebook
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
 * Helper: Scan a string for risk heuristics dynamically from Rulebook
 */
function scanContent(content: string, filename: string) {
    const detections: TripwireResult['detections'] = [];
    const lowerContent = content.toLowerCase();

    // Iterate through EVERY defined legal constraint
    for (const constraint of ALL_CONSTRAINTS) {
        // Check if any of the code indicators for this constraint are present
        for (const indicator of constraint.code_indicators) {
            const lowerIndicator = indicator.toLowerCase();
            const matchIndex = lowerContent.indexOf(lowerIndicator);

            if (matchIndex !== -1) {
                // Extract snippet (context around the match)
                const start = Math.max(0, matchIndex - 50);
                const end = Math.min(content.length, matchIndex + indicator.length + 50);
                const snippet = content.slice(start, end).trim();

                // Found a match!
                detections.push({
                    file: filename,
                    risk: constraint.risk_level,
                    category: constraint.category,
                    heuristic_match: indicator,
                    constraint_id: constraint.constraint_id,
                    snippet: snippet ? `...${snippet}...` : undefined
                });

                // Optimization: Stop checking indicators for this specific constraint on this file
                // once we find a match, to avoid duplicates.
                break;
            }
        }
    }

    return detections;
}

/**
 * Helper: Rank risk tiers
 */
export function getHighestRisk(risks: RiskTier[]): RiskTier {
    const order: RiskTier[] = ['UNACCEPTABLE', 'HIGH_RISK', 'LIMITED_RISK', 'MINIMAL_RISK'];

    // Explicitly check for each tier in order of severity
    if (risks.includes('UNACCEPTABLE')) return 'UNACCEPTABLE';
    if (risks.includes('HIGH_RISK')) return 'HIGH_RISK';
    if (risks.includes('LIMITED_RISK')) return 'LIMITED_RISK';

    return 'MINIMAL_RISK';
}
