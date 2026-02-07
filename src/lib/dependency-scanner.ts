/**
 * Dependency Scanner - Deterministic AI/ML Library Detection
 * 
 * Scans repository data to detect AI/ML libraries WITHOUT using an LLM.
 * Provides verified library data that the LLM can trust for context analysis.
 * 
 * Performance: ~10ms per scan (no network calls)
 */

import { RepoScan } from '@prisma/client';
import {
    AILibrary,
    AICategory,
    RiskIndicatorKey,
    ALL_LIBRARIES,
    findLibraryByName,
    isModelFile,
    LIBRARY_STATS,
} from './ai-library-database';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface DetectedLibrary {
    /** Library metadata from database */
    library: AILibrary;

    /** Where it was found */
    source: 'requirements.txt' | 'package.json' | 'pyproject.toml' | 'setup.py' |
    'pipfile' | 'go.mod' | 'cargo.toml' | 'imports' | 'environment.yml';

    /** Original string that matched */
    matched_string: string;

    /** Version if detected */
    version?: string;
}

export interface RiskIndicators {
    uses_computer_vision: boolean;
    uses_biometric_processing: boolean;
    uses_emotion_recognition: boolean;
    uses_critical_infrastructure: boolean;
    uses_generative_ai: boolean;
    uses_nlp: boolean;
    uses_nlp_decision_making: boolean;
    targets_vulnerable_persons: boolean;
    high_impact_decision_making: boolean;
}

export interface DependencyScanResult {
    /** All detected AI/ML libraries */
    detected_libraries: DetectedLibrary[];

    /** Model files found in file tree */
    detected_model_files: string[];

    /** Import statements extracted from source (if available) */
    sampled_imports: string[];

    /** High confidence AI system determination */
    is_ai_system: boolean;

    /** Overall confidence score (0-1) */
    confidence_score: number;

    /** Detected capability categories */
    detected_categories: AICategory[];

    /** Aggregated risk indicators from matched libraries */
    risk_indicators: RiskIndicators;

    /** Frameworks detected */
    frameworks: string[];

    /** High-risk libraries found */
    high_risk_libraries: string[];

    /** Scan metadata */
    scan_duration_ms: number;
    libraries_checked: number;
}

// =============================================================================
// PARSING FUNCTIONS
// =============================================================================

/**
 * Parse requirements.txt format
 * Handles: package==1.0.0, package>=1.0, package, package[extra]
 */
function parseRequirementsTxt(content: string): { name: string; version?: string }[] {
    if (!content) return [];

    const results: { name: string; version?: string }[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip comments and empty lines
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) {
            continue;
        }

        // Handle -e git+... editable installs
        if (trimmed.startsWith('-e')) {
            continue;
        }

        // Parse package name and version
        // Patterns: pkg==1.0, pkg>=1.0, pkg~=1.0, pkg[extra]==1.0, pkg
        const match = trimmed.match(/^([a-zA-Z0-9_-]+)(?:\[[^\]]+\])?(?:([<>=!~]+)(.+))?/);

        if (match) {
            results.push({
                name: match[1],
                version: match[3]?.trim()
            });
        }
    }

    return results;
}

/**
 * Parse package.json dependencies
 */
function parsePackageJson(content: unknown): { name: string; version?: string }[] {
    if (!content || typeof content !== 'object') return [];

    const results: { name: string; version?: string }[] = [];
    const pkg = content as Record<string, unknown>;

    const depSections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

    for (const section of depSections) {
        const deps = pkg[section];
        if (deps && typeof deps === 'object') {
            for (const [name, version] of Object.entries(deps as Record<string, string>)) {
                results.push({
                    name,
                    version: typeof version === 'string' ? version.replace(/[\^~]/, '') : undefined
                });
            }
        }
    }

    return results;
}

/**
 * Parse pyproject.toml content
 * Note: This is a simplified parser for common patterns
 */
function parsePyprojectToml(content: unknown): { name: string; version?: string }[] {
    if (!content || typeof content !== 'object') return [];

    const results: { name: string; version?: string }[] = [];

    // Handle raw TOML string
    if ('raw' in (content as Record<string, unknown>)) {
        const raw = (content as { raw: string }).raw;

        // Extract dependencies from [project.dependencies] or [tool.poetry.dependencies]
        const depMatches = raw.matchAll(/["']([a-zA-Z0-9_-]+)(?:\[[^\]]+\])?(?:[<>=!~]+[^"']+)?["']/g);

        for (const match of depMatches) {
            results.push({ name: match[1] });
        }
    }

    return results;
}

/**
 * Parse setup.py content for install_requires
 */
function parseSetupPy(content: string | null): { name: string; version?: string }[] {
    if (!content) return [];

    const results: { name: string; version?: string }[] = [];

    // Find install_requires list
    const installRequiresMatch = content.match(/install_requires\s*=\s*\[([\s\S]*?)\]/);

    if (installRequiresMatch) {
        const listContent = installRequiresMatch[1];
        // Extract package names from quotes
        const pkgMatches = listContent.matchAll(/["']([a-zA-Z0-9_-]+)(?:\[[^\]]+\])?(?:[<>=!~]+[^"']+)?["']/g);

        for (const match of pkgMatches) {
            results.push({ name: match[1] });
        }
    }

    return results;
}

/**
 * Parse Pipfile content
 */
function parsePipfile(content: string | null): { name: string; version?: string }[] {
    if (!content) return [];

    const results: { name: string; version?: string }[] = [];

    // Simple line-by-line parsing for [packages] section
    const lines = content.split('\n');
    let inPackages = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === '[packages]' || trimmed === '[dev-packages]') {
            inPackages = true;
            continue;
        }

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            inPackages = false;
            continue;
        }

        if (inPackages && trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=/);
            if (match) {
                results.push({ name: match[1] });
            }
        }
    }

    return results;
}

/**
 * Parse environment.yml (Conda) content
 */
function parseEnvironmentYml(content: string | null): { name: string; version?: string }[] {
    if (!content) return [];

    const results: { name: string; version?: string }[] = [];

    // Find dependencies section and extract package names
    const lines = content.split('\n');
    let inDeps = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === 'dependencies:') {
            inDeps = true;
            continue;
        }

        if (inDeps && trimmed.startsWith('-')) {
            // Handle: - numpy, - numpy=1.21, - pip:
            const pkgLine = trimmed.substring(1).trim();

            // Skip pip: sub-section marker
            if (pkgLine === 'pip:') continue;

            const match = pkgLine.match(/^([a-zA-Z0-9_-]+)(?:[=<>]+.*)?$/);
            if (match) {
                results.push({ name: match[1] });
            }
        }

        // Exit dependencies section
        if (inDeps && !trimmed.startsWith('-') && !trimmed.startsWith(' ') && trimmed.includes(':')) {
            inDeps = false;
        }
    }

    return results;
}

/**
 * Parse go.mod content
 */
function parseGoMod(content: string | null): { name: string; version?: string }[] {
    if (!content) return [];

    const results: { name: string; version?: string }[] = [];

    // Find require block
    const requireMatches = content.matchAll(/require\s*\(\s*([\s\S]*?)\s*\)/g);

    for (const reqMatch of requireMatches) {
        const block = reqMatch[1];
        const lineMatches = block.matchAll(/^\s*([^\s]+)\s+v?([\d.]+)/gm);

        for (const lineMatch of lineMatches) {
            // Extract just the package name (last part of path)
            const fullPath = lineMatch[1];
            const parts = fullPath.split('/');
            const name = parts[parts.length - 1];

            results.push({ name, version: lineMatch[2] });
        }
    }

    return results;
}

/**
 * Parse Cargo.toml content
 */
function parseCargoToml(content: string | null): { name: string; version?: string }[] {
    if (!content) return [];

    const results: { name: string; version?: string }[] = [];

    // Find [dependencies] section
    const lines = content.split('\n');
    let inDeps = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === '[dependencies]' || trimmed === '[dev-dependencies]') {
            inDeps = true;
            continue;
        }

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            inDeps = false;
            continue;
        }

        if (inDeps && trimmed && !trimmed.startsWith('#')) {
            // Handle: pkg = "1.0" or pkg = { version = "1.0" }
            const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=/);
            if (match) {
                results.push({ name: match[1] });
            }
        }
    }

    return results;
}

/**
 * Extract Python imports from source code
 */
function extractPythonImports(sourceCode: string): string[] {
    const imports: Set<string> = new Set();

    // Match: import x, from x import y
    const importMatches = sourceCode.matchAll(/(?:from|import)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g);

    for (const match of importMatches) {
        imports.add(match[1]);
    }

    return Array.from(imports);
}

/**
 * Extract JavaScript/TypeScript imports from source code
 */
function extractJSImports(sourceCode: string): string[] {
    const imports: Set<string> = new Set();

    // Match: import x from 'pkg', require('pkg'), import('pkg')
    const patterns = [
        /from\s+['"]([^'"]+)['"]/g,
        /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];

    for (const pattern of patterns) {
        const matches = sourceCode.matchAll(pattern);
        for (const match of matches) {
            // Get package name (first part before /)
            const pkg = match[1].split('/')[0];
            // Skip relative imports
            if (!pkg.startsWith('.')) {
                imports.add(pkg);
            }
        }
    }

    return Array.from(imports);
}

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

/**
 * Scan file tree for model files
 */
function findModelFiles(fileTree: unknown): string[] {
    const models: string[] = [];

    function traverse(node: unknown, path: string = ''): void {
        if (!node || typeof node !== 'object') return;

        const n = node as Record<string, unknown>;
        const nodeName = n.name as string || '';
        const currentPath = path ? `${path}/${nodeName}` : nodeName;

        if (n.type === 'file') {
            if (isModelFile(currentPath)) {
                models.push(currentPath);
            }
        } else if (n.children && Array.isArray(n.children)) {
            for (const child of n.children) {
                traverse(child, currentPath);
            }
        }
    }

    traverse(fileTree);
    return models;
}

/**
 * Match detected packages against AI library database
 */
function matchLibraries(
    packages: { name: string; version?: string }[],
    source: DetectedLibrary['source']
): DetectedLibrary[] {
    const detected: DetectedLibrary[] = [];

    for (const pkg of packages) {
        const library = findLibraryByName(pkg.name);

        if (library) {
            detected.push({
                library,
                source,
                matched_string: pkg.name,
                version: pkg.version,
            });
        }
    }

    return detected;
}

/**
 * Aggregate risk indicators from detected libraries
 */
function aggregateRiskIndicators(libraries: DetectedLibrary[]): RiskIndicators {
    const indicators: RiskIndicators = {
        uses_computer_vision: false,
        uses_biometric_processing: false,
        uses_emotion_recognition: false,
        uses_critical_infrastructure: false,
        uses_generative_ai: false,
        uses_nlp: false,
        uses_nlp_decision_making: false,
        targets_vulnerable_persons: false,
        high_impact_decision_making: false,
    };

    for (const detected of libraries) {
        for (const indicator of detected.library.risk_indicators) {
            if (indicator in indicators) {
                indicators[indicator as RiskIndicatorKey] = true;
            }
        }
    }

    return indicators;
}

/**
 * Calculate confidence score based on detection quality
 */
function calculateConfidence(
    libraries: DetectedLibrary[],
    modelFiles: string[],
    sampledImports: string[]
): number {
    let score = 0;

    // High-confidence libraries (deep learning, etc.)
    const highConfLibs = libraries.filter(l => l.library.confidence >= 0.9);
    if (highConfLibs.length > 0) {
        score += 0.4;
    }

    // Multiple AI libraries found
    if (libraries.length >= 3) {
        score += 0.2;
    } else if (libraries.length >= 1) {
        score += 0.1;
    }

    // Model files found
    if (modelFiles.length > 0) {
        score += 0.2;
    }

    // Imports confirm dependency file findings
    const importNames = new Set(sampledImports.map(i => i.toLowerCase()));
    const libNames = new Set(libraries.map(l => l.library.name.toLowerCase()));
    const overlap = [...importNames].filter(i => libNames.has(i)).length;
    if (overlap > 0) {
        score += 0.1;
    }

    // High-risk libraries have higher confidence
    const highRisk = libraries.filter(l => l.library.high_risk_flag);
    if (highRisk.length > 0) {
        score += 0.1;
    }

    return Math.min(score, 1.0);
}

// =============================================================================
// MAIN SCANNER FUNCTION
// =============================================================================

/**
 * Scan repository for AI/ML dependencies
 * 
 * This is the main entry point for deterministic dependency detection.
 * It runs BEFORE the LLM analysis to provide verified library data.
 * 
 * @param repoScan - Repository scan data from database
 * @returns Structured detection results with verified libraries
 */
export function scanDependencies(repoScan: RepoScan): DependencyScanResult {
    const startTime = Date.now();

    const detectedLibraries: DetectedLibrary[] = [];
    const sampledImports: string[] = [];

    // Parse requirements.txt
    if (repoScan.requirements_txt_content) {
        const pkgs = parseRequirementsTxt(repoScan.requirements_txt_content);
        detectedLibraries.push(...matchLibraries(pkgs, 'requirements.txt'));
    }

    // Parse package.json
    if (repoScan.package_json_content) {
        const pkgs = parsePackageJson(repoScan.package_json_content);
        detectedLibraries.push(...matchLibraries(pkgs, 'package.json'));
    }

    // Parse pyproject.toml
    if (repoScan.pyproject_toml_content) {
        const pkgs = parsePyprojectToml(repoScan.pyproject_toml_content);
        detectedLibraries.push(...matchLibraries(pkgs, 'pyproject.toml'));
    }

    // Parse additional files if available (new fields from migration)
    const extendedScan = repoScan as RepoScan & {
        setup_py_content?: string | null;
        pipfile_content?: string | null;
        environment_yml_content?: string | null;
        cargo_toml_content?: string | null;
        go_mod_content?: string | null;
        sampled_imports?: string[] | null;
    };

    if (extendedScan.setup_py_content) {
        const pkgs = parseSetupPy(extendedScan.setup_py_content);
        detectedLibraries.push(...matchLibraries(pkgs, 'setup.py'));
    }

    if (extendedScan.pipfile_content) {
        const pkgs = parsePipfile(extendedScan.pipfile_content);
        detectedLibraries.push(...matchLibraries(pkgs, 'pipfile'));
    }

    if (extendedScan.environment_yml_content) {
        const pkgs = parseEnvironmentYml(extendedScan.environment_yml_content);
        detectedLibraries.push(...matchLibraries(pkgs, 'environment.yml'));
    }

    if (extendedScan.cargo_toml_content) {
        const pkgs = parseCargoToml(extendedScan.cargo_toml_content);
        detectedLibraries.push(...matchLibraries(pkgs, 'cargo.toml'));
    }

    if (extendedScan.go_mod_content) {
        const pkgs = parseGoMod(extendedScan.go_mod_content);
        detectedLibraries.push(...matchLibraries(pkgs, 'go.mod'));
    }

    // Use pre-extracted imports if available
    if (extendedScan.sampled_imports && Array.isArray(extendedScan.sampled_imports)) {
        sampledImports.push(...extendedScan.sampled_imports);
    }

    // Find model files in file tree
    const modelFiles = findModelFiles(repoScan.file_tree);

    // Deduplicate libraries (same library from multiple sources)
    const uniqueLibraries = new Map<string, DetectedLibrary>();
    for (const lib of detectedLibraries) {
        const key = lib.library.name.toLowerCase();
        if (!uniqueLibraries.has(key)) {
            uniqueLibraries.set(key, lib);
        }
    }
    const finalLibraries = Array.from(uniqueLibraries.values());

    // Aggregate results
    const riskIndicators = aggregateRiskIndicators(finalLibraries);
    const confidence = calculateConfidence(finalLibraries, modelFiles, sampledImports);

    // Determine if this is an AI system
    const isAISystem = finalLibraries.length > 0 || modelFiles.length > 0;

    // Extract unique categories
    const categories = new Set<AICategory>();
    for (const lib of finalLibraries) {
        categories.add(lib.library.category);
        if (lib.library.secondary_categories) {
            for (const cat of lib.library.secondary_categories) {
                categories.add(cat);
            }
        }
    }

    // Extract frameworks
    const frameworks = new Set<string>();
    for (const lib of finalLibraries) {
        if (lib.library.frameworks) {
            for (const fw of lib.library.frameworks) {
                frameworks.add(fw);
            }
        }
    }

    // Identify high-risk libraries
    const highRiskLibs = finalLibraries
        .filter(l => l.library.high_risk_flag)
        .map(l => l.library.name);

    return {
        detected_libraries: finalLibraries,
        detected_model_files: modelFiles,
        sampled_imports: sampledImports,
        is_ai_system: isAISystem,
        confidence_score: confidence,
        detected_categories: Array.from(categories),
        risk_indicators: riskIndicators,
        frameworks: Array.from(frameworks),
        high_risk_libraries: highRiskLibs,
        scan_duration_ms: Date.now() - startTime,
        libraries_checked: LIBRARY_STATS.total,
    };
}

/**
 * Quick check if a repo likely contains AI (for fast screening)
 */
export function quickAICheck(repoScan: RepoScan): boolean {
    const result = scanDependencies(repoScan);
    return result.is_ai_system;
}

/**
 * Get human-readable summary of scan results
 */
export function getScanSummary(result: DependencyScanResult): string {
    if (!result.is_ai_system) {
        return 'No AI/ML libraries detected.';
    }

    const libNames = result.detected_libraries.map(l => l.library.name).join(', ');
    const catNames = result.detected_categories.join(', ');

    let summary = `Detected ${result.detected_libraries.length} AI/ML libraries: ${libNames}`;
    summary += `\nCategories: ${catNames}`;
    summary += `\nConfidence: ${(result.confidence_score * 100).toFixed(0)}%`;

    if (result.high_risk_libraries.length > 0) {
        summary += `\n⚠️ High-risk libraries: ${result.high_risk_libraries.join(', ')}`;
    }

    if (result.detected_model_files.length > 0) {
        summary += `\nModel files found: ${result.detected_model_files.length}`;
    }

    return summary;
}
