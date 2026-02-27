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

    /** Line number where it was found (Phase 3 Evidence Traceability) */
    source_line?: number;

    /** Detection layer (1 = known DB, 2 = pattern, 3 = LLM) */
    detection_layer: 1 | 2 | 3;
}

/**
 * Candidate AI library detected by pattern matching (Layer 2)
 * Not in our database but has AI-related naming patterns
 */
export interface CandidateLibrary {
    /** Package name */
    name: string;

    /** Where it was found */
    source: DetectedLibrary['source'];

    /** Version if detected */
    version?: string;

    /** Pattern that matched */
    matched_pattern: string;

    /** Confidence based on pattern strength (0.5-0.8) */
    pattern_confidence: number;

    /** Inferred category from pattern */
    inferred_category?: AICategory;

    /** Inferred risk indicator */
    inferred_risk?: RiskIndicatorKey;
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
    /** All detected AI/ML libraries (Layer 1: known database) */
    detected_libraries: DetectedLibrary[];

    /** Candidate AI libraries (Layer 2: pattern matching) */
    candidate_libraries: CandidateLibrary[];

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

    /** All packages found (for LLM Layer 3) */
    all_packages: string[];

    /** Context signals for API wrapper detection (Layer 3.5) */
    context_signals: ContextSignals;
}

/**
 * Context signals for detecting API wrappers and AI systems without libraries
 * These are heuristic signals that suggest AI usage even without explicit ML libraries
 */
export interface ContextSignals {
    /** AI-related file names found (e.g., llm.ts, ai.ts, groq.ts) */
    ai_file_names: string[];

    /** README mentions AI/ML keywords */
    readme_ai_keywords: string[];

    /** Likely AI API usage detected (env var patterns, API URLs) */
    likely_api_usage: boolean;

    /** Overall context confidence (0-1) */
    context_confidence: number;

    /** Human-readable summary */
    summary: string;
}


// =============================================================================
// LAYER 2: AI PATTERN DETECTION
// =============================================================================

/**
 * Patterns that strongly indicate AI/ML libraries
 * Order matters - more specific patterns first
 */
const AI_PATTERNS: {
    pattern: RegExp;
    name: string;
    confidence: number;
    category?: AICategory;
    risk?: RiskIndicatorKey;
}[] = [
        // LLM and Generative AI
        { pattern: /\b(llm|llama|gpt|claude|gemini|mistral|ollama|openai|anthropic)\b/i, name: 'llm', confidence: 0.85, category: 'generative_ai', risk: 'uses_generative_ai' },
        { pattern: /-llm|-gpt|-ai$/i, name: 'llm-suffix', confidence: 0.8, category: 'generative_ai', risk: 'uses_generative_ai' },
        { pattern: /^(langchain|llama[-_]?index|autogen|crewai|phidata)/i, name: 'agent-framework', confidence: 0.9, category: 'generative_ai', risk: 'uses_generative_ai' },

        // Agent frameworks
        { pattern: /[-_](agent|agents)$|^agent[-_]|[-_]agent[-_]/i, name: 'agent', confidence: 0.75, category: 'generative_ai', risk: 'uses_generative_ai' },

        // ML/AI suffixes and prefixes
        { pattern: /[-_](ml|ai|nn|dnn)$|^(ml|ai)[-_]/i, name: 'ml-suffix', confidence: 0.7, category: 'mlops' },
        { pattern: /[-_](neural|network|model|predict)/i, name: 'neural', confidence: 0.7, category: 'deep_learning' },

        // Deep Learning
        { pattern: /\b(torch|pytorch|tensorflow|keras|jax|flax|mxnet|caffe|paddle)\b/i, name: 'deep-learning', confidence: 0.95, category: 'deep_learning' },
        { pattern: /[-_](transformer|bert|embedding|encoder|decoder)/i, name: 'transformer', confidence: 0.8, category: 'nlp', risk: 'uses_nlp' },

        // Computer Vision
        { pattern: /\b(opencv|pillow|cv2|vision|image[-_]?net|yolo|detectron)\b/i, name: 'cv', confidence: 0.85, category: 'computer_vision', risk: 'uses_computer_vision' },
        { pattern: /[-_](vision|image|video|camera|ocr|face)[-_]/i, name: 'cv-related', confidence: 0.7, category: 'computer_vision', risk: 'uses_computer_vision' },

        // NLP
        { pattern: /\b(nltk|spacy|huggingface|tokenizers?|sentiment|ner)\b/i, name: 'nlp', confidence: 0.85, category: 'nlp', risk: 'uses_nlp' },
        { pattern: /[-_](nlp|text|language|chat|speech|tts|stt|whisper)/i, name: 'nlp-related', confidence: 0.7, category: 'nlp', risk: 'uses_nlp' },

        // Cloud AI Services (using generative_ai since cloud_ai isn't in AICategory)
        { pattern: /@aws-sdk\/client-(bedrock|sagemaker|rekognition|comprehend|polly|transcribe)/i, name: 'aws-ai', confidence: 0.9, category: 'generative_ai', risk: 'uses_generative_ai' },
        { pattern: /@azure\/(openai|cognitiveservices|ai)/i, name: 'azure-ai', confidence: 0.9, category: 'generative_ai', risk: 'uses_generative_ai' },
        { pattern: /@google-cloud\/(aiplatform|vision|language|speech|translate)/i, name: 'gcp-ai', confidence: 0.9, category: 'generative_ai', risk: 'uses_generative_ai' },

        // Vector/Embedding stores
        { pattern: /\b(pinecone|weaviate|qdrant|milvus|chroma|faiss|annoy|pgvector)\b/i, name: 'vector-db', confidence: 0.85, category: 'data_processing', risk: 'uses_generative_ai' },
        { pattern: /[-_](embedding|vector[-_]?store|semantic)/i, name: 'embedding', confidence: 0.75, category: 'data_processing' },

        // Biometrics (high-risk)
        { pattern: /\b(face[-_]?recognition|deepface|insightface|dlib|biometric)/i, name: 'biometrics', confidence: 0.95, category: 'biometrics', risk: 'uses_biometric_processing' },
        { pattern: /[-_](face|fingerprint|iris|voice[-_]?id)/i, name: 'bio-related', confidence: 0.7, category: 'biometrics', risk: 'uses_biometric_processing' },

        // Audio/Speech
        { pattern: /\b(elevenlabs|bark|coqui|pyttsx|resemble|playht)\b/i, name: 'tts', confidence: 0.85, category: 'nlp', risk: 'uses_nlp' },

        // Reinforcement Learning
        { pattern: /\b(gym|stable[-_]?baselines|ray[-_]?rllib|tianshou)\b/i, name: 'rl', confidence: 0.9, category: 'reinforcement_learning' },

        // Data Science (lower confidence - might not be AI)
        { pattern: /\b(numpy|pandas|scipy|sklearn|scikit[-_]?learn)\b/i, name: 'data-science', confidence: 0.75, category: 'data_processing' },
        { pattern: /\b(matplotlib|seaborn|plotly)\b/i, name: 'visualization', confidence: 0.5, category: 'data_processing' },
    ];

/**
 * Known AI library namespace prefixes
 */
const AI_NAMESPACE_PREFIXES = [
    '@huggingface/',
    '@tensorflow/',
    '@langchain/',
    '@llamaindex/',
    '@openai/',
    '@anthropic/',
    '@google-ai/',
    '@mariozechner/pi-', // OpenClaw's AI lib
];

/**
 * Check if package name matches AI patterns (Layer 2)
 */
export function matchAIPatterns(packageName: string): CandidateLibrary | null {
    // First check namespace prefixes
    for (const prefix of AI_NAMESPACE_PREFIXES) {
        if (packageName.startsWith(prefix)) {
            return {
                name: packageName,
                source: 'package.json',
                matched_pattern: `namespace:${prefix}`,
                pattern_confidence: 0.85,
                inferred_category: 'generative_ai',
                inferred_risk: 'uses_generative_ai',
            };
        }
    }

    // Then check regex patterns
    for (const { pattern, name, confidence, category, risk } of AI_PATTERNS) {
        if (pattern.test(packageName)) {
            return {
                name: packageName,
                source: 'package.json',
                matched_pattern: name,
                pattern_confidence: confidence,
                inferred_category: category,
                inferred_risk: risk,
            };
        }
    }

    return null;
}

/**
 * Detect candidate AI libraries from all packages (Layer 2)
 */
function detectCandidateLibraries(
    packages: { name: string; version?: string }[],
    source: DetectedLibrary['source'],
    knownLibraryNames: Set<string>
): CandidateLibrary[] {
    const candidates: CandidateLibrary[] = [];

    for (const pkg of packages) {
        // Skip if already matched in Layer 1 (known database)
        if (knownLibraryNames.has(pkg.name.toLowerCase())) {
            continue;
        }

        const candidate = matchAIPatterns(pkg.name);
        if (candidate) {
            candidates.push({
                ...candidate,
                source,
                version: pkg.version,
            });
        }
    }

    return candidates;
}



/**
 * Parse requirements.txt format
 * Handles: package==1.0.0, package>=1.0, package, package[extra]
 */
function parseRequirementsTxt(content: string): { name: string; version?: string }[] {
    if (!content) return [];

    const results: { name: string; version?: string; source_line?: number }[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
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
                version: match[3]?.trim(),
                source_line: i + 1, // 1-indexed line number
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
                // Line numbers aren't easily extracted from parsed JSON, so we leave it omitted
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
 * Match detected packages against AI library database (Layer 1)
 */
function matchLibraries(
    packages: { name: string; version?: string; source_line?: number }[],
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
                source_line: pkg.source_line,
                detection_layer: 1, // Layer 1: Known database match
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
// LAYER 3.5: CONTEXT SIGNAL DETECTION (API WRAPPER DETECTION)
// =============================================================================

/** Keywords that suggest AI/ML usage in README */
const README_AI_KEYWORDS = [
    'artificial intelligence', 'machine learning', 'deep learning',
    'neural network', 'llm', 'large language model', 'gpt', 'chatgpt',
    'openai', 'anthropic', 'claude', 'groq', 'gemini', 'llama',
    'ai-powered', 'ai powered', 'uses ai', 'powered by ai',
    'natural language processing', 'nlp', 'computer vision',
    'text generation', 'image generation', 'speech recognition',
    'face recognition', 'object detection', 'sentiment analysis',
    'hugging face', 'huggingface', 'transformer', 'bert',
    'embedding', 'vector database', 'rag', 'retrieval augmented',
    'langchain', 'llamaindex', 'agent', 'ai agent',
];

/** File names that suggest AI/ML code */
const AI_FILE_PATTERNS = [
    /\b(llm|ai|ml|gpt|claude|groq|openai|anthropic|gemini)\.(ts|js|py|tsx|jsx)$/i,
    /\b(model|inference|predict|embed|generate|chat|agent)\.(ts|js|py|tsx|jsx)$/i,
    /\b(neural|transformer|bert|tokenizer)\.(ts|js|py)$/i,
];

/**
 * Detect context signals that suggest AI usage without explicit libraries
 * Useful for API wrappers and systems using raw HTTP calls to AI services
 */
function detectContextSignals(repoScan: RepoScan): ContextSignals {
    const aiFileNames: string[] = [];
    const readmeKeywords: string[] = [];
    let likelyApiUsage = false;

    // Check README for AI keywords
    const readmeContent = (repoScan.readme_content || '').toLowerCase();
    for (const keyword of README_AI_KEYWORDS) {
        if (readmeContent.includes(keyword.toLowerCase())) {
            readmeKeywords.push(keyword);
        }
    }

    // Check file tree for AI-related file names
    if (repoScan.file_tree) {
        const checkFileTree = (node: unknown, path: string = '') => {
            if (!node || typeof node !== 'object') return;
            const n = node as { name?: string; type?: string; children?: unknown[] };
            const currentPath = path ? `${path}/${n.name || ''}` : (n.name || '');

            if (n.type === 'file' && n.name) {
                for (const pattern of AI_FILE_PATTERNS) {
                    if (pattern.test(n.name)) {
                        aiFileNames.push(currentPath);
                        break;
                    }
                }
            }

            if (n.children && Array.isArray(n.children)) {
                for (const child of n.children) {
                    checkFileTree(child, currentPath);
                }
            }
        };
        checkFileTree(repoScan.file_tree);
    }

    // Determine if likely using AI APIs
    // Strong signals: readme mentions specific AI services + has AI-related files
    likelyApiUsage = (
        readmeKeywords.some(k => ['openai', 'anthropic', 'claude', 'groq', 'gemini'].includes(k.toLowerCase())) ||
        aiFileNames.length > 0
    );

    // Calculate context confidence
    let confidence = 0;
    if (readmeKeywords.length > 0) confidence += Math.min(readmeKeywords.length * 0.1, 0.4);
    if (aiFileNames.length > 0) confidence += Math.min(aiFileNames.length * 0.15, 0.4);
    if (likelyApiUsage) confidence += 0.2;
    confidence = Math.min(confidence, 0.95);

    // Generate summary
    let summary = '';
    if (confidence > 0) {
        const parts: string[] = [];
        if (readmeKeywords.length > 0) {
            parts.push(`README mentions: ${readmeKeywords.slice(0, 5).join(', ')}`);
        }
        if (aiFileNames.length > 0) {
            parts.push(`AI files: ${aiFileNames.slice(0, 5).join(', ')}`);
        }
        summary = parts.join('; ') || 'Context signals detected';
    }

    return {
        ai_file_names: aiFileNames,
        readme_ai_keywords: readmeKeywords,
        likely_api_usage: likelyApiUsage,
        context_confidence: confidence,
        summary,
    };
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
    const candidateLibraries: CandidateLibrary[] = [];
    const sampledImports: string[] = [];
    const allPackages: { name: string; version?: string; source_line?: number; source: DetectedLibrary['source'] }[] = [];

    // Helper to collect all packages for Layer 3 LLM fallback
    const collectPackages = (pkgs: { name: string; version?: string; source_line?: number }[], source: DetectedLibrary['source']) => {
        for (const pkg of pkgs) {
            allPackages.push({ ...pkg, source });
        }
    };

    // Parse requirements.txt
    if (repoScan.requirements_txt_content) {
        const pkgs = parseRequirementsTxt(repoScan.requirements_txt_content);
        collectPackages(pkgs, 'requirements.txt');
        detectedLibraries.push(...matchLibraries(pkgs, 'requirements.txt'));
    }

    // Parse package.json
    if (repoScan.package_json_content) {
        const pkgs = parsePackageJson(repoScan.package_json_content);
        collectPackages(pkgs, 'package.json');
        detectedLibraries.push(...matchLibraries(pkgs, 'package.json'));
    }

    // Parse pyproject.toml
    if (repoScan.pyproject_toml_content) {
        const pkgs = parsePyprojectToml(repoScan.pyproject_toml_content);
        collectPackages(pkgs, 'pyproject.toml');
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
        collectPackages(pkgs, 'setup.py');
        detectedLibraries.push(...matchLibraries(pkgs, 'setup.py'));
    }

    if (extendedScan.pipfile_content) {
        const pkgs = parsePipfile(extendedScan.pipfile_content);
        collectPackages(pkgs, 'pipfile');
        detectedLibraries.push(...matchLibraries(pkgs, 'pipfile'));
    }

    if (extendedScan.environment_yml_content) {
        const pkgs = parseEnvironmentYml(extendedScan.environment_yml_content);
        collectPackages(pkgs, 'environment.yml');
        detectedLibraries.push(...matchLibraries(pkgs, 'environment.yml'));
    }

    if (extendedScan.cargo_toml_content) {
        const pkgs = parseCargoToml(extendedScan.cargo_toml_content);
        collectPackages(pkgs, 'cargo.toml');
        detectedLibraries.push(...matchLibraries(pkgs, 'cargo.toml'));
    }

    if (extendedScan.go_mod_content) {
        const pkgs = parseGoMod(extendedScan.go_mod_content);
        collectPackages(pkgs, 'go.mod');
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

    // =================================================================
    // LAYER 2: Pattern matching for unknown packages
    // =================================================================
    const knownLibNames = new Set(finalLibraries.map(l => l.library.name.toLowerCase()));

    // Group all packages by source for Layer 2 detection
    const packagesBySource = new Map<DetectedLibrary['source'], { name: string; version?: string }[]>();
    for (const pkg of allPackages) {
        if (!packagesBySource.has(pkg.source)) {
            packagesBySource.set(pkg.source, []);
        }
        packagesBySource.get(pkg.source)!.push({ name: pkg.name, version: pkg.version });
    }

    // Run Layer 2 pattern detection on each source
    for (const [source, pkgs] of packagesBySource) {
        const candidates = detectCandidateLibraries(pkgs, source, knownLibNames);
        candidateLibraries.push(...candidates);
    }

    // Deduplicate candidates
    const uniqueCandidates = new Map<string, CandidateLibrary>();
    for (const cand of candidateLibraries) {
        const key = cand.name.toLowerCase();
        if (!uniqueCandidates.has(key)) {
            uniqueCandidates.set(key, cand);
        }
    }
    const finalCandidates = Array.from(uniqueCandidates.values());

    // Aggregate results (include candidate risk indicators)
    const riskIndicators = aggregateRiskIndicators(finalLibraries);

    // Add candidate risk indicators
    for (const cand of finalCandidates) {
        if (cand.inferred_risk) {
            const key = cand.inferred_risk as keyof RiskIndicators;
            if (key in riskIndicators) {
                riskIndicators[key] = true;
            }
        }
    }

    const confidence = calculateConfidence(finalLibraries, modelFiles, sampledImports);

    // Determine if this is an AI system (now includes Layer 2 candidates)
    const isAISystem = finalLibraries.length > 0 || finalCandidates.length > 0 || modelFiles.length > 0;

    // Extract unique categories (include candidate categories)
    const categories = new Set<AICategory>();
    for (const lib of finalLibraries) {
        categories.add(lib.library.category);
        if (lib.library.secondary_categories) {
            for (const cat of lib.library.secondary_categories) {
                categories.add(cat);
            }
        }
    }
    for (const cand of finalCandidates) {
        if (cand.inferred_category) {
            categories.add(cand.inferred_category);
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

    // =================================================================
    // LAYER 3.5: Context Signals (API Wrapper Detection)
    // =================================================================
    const contextSignals = detectContextSignals(repoScan);

    // Update is_ai_system to include context signals
    // If context signals are strong enough, treat as AI system even without libraries
    const isAIByContext = contextSignals.context_confidence >= 0.5;
    const finalIsAISystem = isAISystem || isAIByContext;

    // Boost confidence if context signals support library detection
    let finalConfidence = confidence;
    if (finalLibraries.length > 0 && contextSignals.context_confidence > 0) {
        finalConfidence = Math.min(confidence + contextSignals.context_confidence * 0.2, 1.0);
    } else if (isAIByContext && !isAISystem) {
        // API wrapper case: use context confidence as base
        finalConfidence = contextSignals.context_confidence;
    }

    return {
        detected_libraries: finalLibraries,
        candidate_libraries: finalCandidates,
        detected_model_files: modelFiles,
        sampled_imports: sampledImports,
        is_ai_system: finalIsAISystem,
        confidence_score: finalConfidence,
        detected_categories: Array.from(categories),
        risk_indicators: riskIndicators,
        frameworks: Array.from(frameworks),
        high_risk_libraries: highRiskLibs,
        scan_duration_ms: Date.now() - startTime,
        libraries_checked: LIBRARY_STATS.total,
        all_packages: allPackages.map(p => p.name),
        context_signals: contextSignals,
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
        summary += `\n[WARNING] High-risk libraries: ${result.high_risk_libraries.join(', ')}`;
    }

    if (result.detected_model_files.length > 0) {
        summary += `\nModel files found: ${result.detected_model_files.length}`;
    }

    return summary;
}
