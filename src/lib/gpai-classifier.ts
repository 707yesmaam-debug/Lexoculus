/**
 * GPAI Classification Engine
 * 
 * Classifies AI systems as General-Purpose AI (GPAI) deployers or providers
 * under EU AI Act Chapter V (Articles 51-55).
 * 
 * Source: Regulation (EU) 2024/1689, Chapter V
 * Articles 51-55, Annexes XI, XII, XIII
 * Entry into force: 2 August 2025
 */

import { LlmCapabilityAnalysis } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

export interface GPAIClassification {
    /** Uses GPAI models via API (most common for our users) */
    is_gpai_deployer: boolean;

    /** Trains/hosts GPAI models (rare — OpenAI, Anthropic, etc.) */
    is_gpai_provider: boolean;

    /** ≥10^25 FLOPs or Commission-designated (Article 51) */
    is_systemic_risk: boolean;

    /** Detected GPAI model providers */
    detected_providers: GPAIProviderMatch[];

    /** Detected specific model names */
    detected_models: string[];

    /** Article 53(2) — free/open-source with public params */
    open_source_exception: boolean;

    /** Mapped obligations from Articles 53/55 */
    obligations: GPAIObligation[];

    /** Article 50 deployer transparency requirements */
    transparency_requirements: string[];

    /** Exact article citations for audit trail */
    article_references: string[];

    /** Human-readable summary */
    summary: string;
}

export interface GPAIProviderMatch {
    provider_name: string;
    matched_by: 'library' | 'capability' | 'framework' | 'model_type';
    confidence: number; // 0-1
    systemic_risk: boolean;
    open_source: boolean;
}

export interface GPAIObligation {
    /** e.g., "Article 53(1)(a)" */
    article: string;

    /** e.g., "Technical Documentation" */
    title: string;

    /** From official EU AI Act text */
    description: string;

    /** e.g., "Annex XI" */
    annex_reference?: string;

    /** Who this obligation applies to */
    applies_to: 'provider' | 'deployer' | 'both';

    /** ISO date string */
    deadline: string;

    /** Whether this is an additional systemic risk obligation */
    systemic_risk_only: boolean;
}

// =============================================================================
// GPAI PROVIDER DATABASE
// =============================================================================

interface GPAIProviderInfo {
    /** NPM/pip package names that indicate usage */
    library_indicators: string[];

    /** Known model names */
    models: string[];

    /** Whether models from this provider are ≥10^25 FLOPs */
    systemic_risk: boolean;

    /** Whether models are open-source with public parameters */
    open_source: boolean;

    /** Human-readable provider name */
    display_name: string;
}

/**
 * Database of known GPAI model providers.
 * 
 * systemic_risk is based on the 10^25 FLOPs threshold (Article 51(2))
 * and Commission designations as of August 2025.
 */
const GPAI_PROVIDERS: Record<string, GPAIProviderInfo> = {
    openai: {
        display_name: 'OpenAI',
        library_indicators: ['openai', '@openai/api', 'chatgpt', 'openai-api'],
        models: ['gpt-4', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-3.5', 'dall-e-3', 'dall-e-2', 'whisper', 'tts-1', 'text-embedding-3', 'o1', 'o1-mini', 'o1-preview'],
        systemic_risk: true, // GPT-4 exceeds 10^25 FLOPs
        open_source: false,
    },
    anthropic: {
        display_name: 'Anthropic',
        library_indicators: ['@anthropic-ai/sdk', 'anthropic'],
        models: ['claude-3', 'claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku', 'claude-3.5-haiku', 'claude-2', 'claude-2.1'],
        systemic_risk: true, // Claude 3 Opus likely exceeds threshold
        open_source: false,
    },
    google: {
        display_name: 'Google DeepMind',
        library_indicators: ['@google/generative-ai', '@google-ai/generativelanguage', 'google-generativeai', 'vertexai'],
        models: ['gemini-pro', 'gemini-ultra', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0', 'palm-2', 'gemma'],
        systemic_risk: true, // Gemini Ultra exceeds threshold
        open_source: false, // Gemma is open but Gemini is not
    },
    meta: {
        display_name: 'Meta AI',
        library_indicators: ['llama', 'llama-cpp', 'llama.cpp'],
        models: ['llama-3', 'llama-3.1', 'llama-3.2', 'llama-2', 'llama-2-70b', 'codellama', 'llama-3-70b'],
        systemic_risk: false, // Llama 3 70B may be below threshold
        open_source: true,   // Released under open license with public weights
    },
    mistral: {
        display_name: 'Mistral AI',
        library_indicators: ['@mistralai/mistralai', 'mistralai'],
        models: ['mistral-large', 'mistral-medium', 'mistral-small', 'mixtral-8x7b', 'mixtral-8x22b', 'codestral', 'mistral-7b'],
        systemic_risk: false,
        open_source: true, // Mixtral is open-source
    },
    cohere: {
        display_name: 'Cohere',
        library_indicators: ['cohere-ai', 'cohere'],
        models: ['command-r', 'command-r-plus', 'command', 'command-light', 'embed-v3'],
        systemic_risk: false,
        open_source: false,
    },
    groq: {
        display_name: 'Groq',
        library_indicators: ['groq-sdk', 'groq'],
        models: [], // Groq is inference infra, not a model provider
        systemic_risk: false,
        open_source: false,
    },
    huggingface: {
        display_name: 'Hugging Face',
        library_indicators: ['@huggingface/inference', 'huggingface_hub', 'transformers'],
        models: [], // Hub hosts many models — provider depends on model used
        systemic_risk: false,
        open_source: true,
    },
    stability: {
        display_name: 'Stability AI',
        library_indicators: ['stability-sdk', '@stability-ai/sdk'],
        models: ['stable-diffusion', 'stable-diffusion-xl', 'sdxl', 'sd-3'],
        systemic_risk: false,
        open_source: true,
    },
    perplexity: {
        display_name: 'Perplexity',
        library_indicators: ['perplexity-sdk'],
        models: ['pplx-70b', 'pplx-7b'],
        systemic_risk: false,
        open_source: false,
    },
};

/**
 * LangChain and orchestration frameworks that indicate GPAI usage
 * but don't tell us which provider — need to check further
 */
const GPAI_ORCHESTRATION_FRAMEWORKS = [
    'langchain', '@langchain/core', '@langchain/openai', '@langchain/anthropic',
    '@langchain/google-genai', '@langchain/community', 'llamaindex',
    'semantic-kernel', 'autogen', 'crewai', 'haystack',
];

/**
 * Capability keywords that suggest GPAI usage
 */
const GPAI_CAPABILITY_KEYWORDS = [
    'llm', 'large language model', 'gpt', 'chatbot', 'chat completion',
    'text generation', 'code generation', 'ai assistant', 'conversational ai',
    'prompt engineering', 'retrieval augmented generation', 'rag',
    'embedding', 'vector search', 'semantic search',
    'image generation', 'text-to-image', 'text-to-speech', 'speech-to-text',
    'ai-powered', 'generative ai', 'foundation model',
];

// =============================================================================
// GPAI OBLIGATIONS DATABASE (Articles 53 + 55)
// =============================================================================

const GPAI_PROVIDER_OBLIGATIONS: GPAIObligation[] = [
    {
        article: 'Article 53(1)(a)',
        title: 'Technical Documentation',
        description: 'Draw up and keep up-to-date technical documentation of the model, including its training and testing process and the results of its evaluation, containing at a minimum the information set out in Annex XI.',
        annex_reference: 'Annex XI',
        applies_to: 'provider',
        deadline: '2025-08-02',
        systemic_risk_only: false,
    },
    {
        article: 'Article 53(1)(b)',
        title: 'Downstream Provider Information',
        description: 'Draw up, keep up-to-date and make available information and documentation to providers of AI systems who intend to integrate the GPAI model, containing at a minimum the elements set out in Annex XII.',
        annex_reference: 'Annex XII',
        applies_to: 'provider',
        deadline: '2025-08-02',
        systemic_risk_only: false,
    },
    {
        article: 'Article 53(1)(c)',
        title: 'Copyright Compliance Policy',
        description: 'Put in place a policy to comply with Union law on copyright and related rights, including through state-of-the-art technologies to identify and comply with reservations of rights expressed pursuant to Article 4(3) of Directive (EU) 2019/790.',
        applies_to: 'provider',
        deadline: '2025-08-02',
        systemic_risk_only: false,
    },
    {
        article: 'Article 53(1)(d)',
        title: 'Training Data Summary',
        description: 'Draw up and make publicly available a sufficiently detailed summary about the content used for training of the general-purpose AI model, according to a template provided by the AI Office.',
        applies_to: 'provider',
        deadline: '2025-08-02',
        systemic_risk_only: false,
    },
];

const GPAI_SYSTEMIC_RISK_OBLIGATIONS: GPAIObligation[] = [
    {
        article: 'Article 55(1)(a)',
        title: 'Model Evaluation & Adversarial Testing',
        description: 'Perform model evaluation in accordance with standardised protocols and tools reflecting the state of the art, including conducting and documenting adversarial testing of the model with a view to identifying and mitigating systemic risks.',
        applies_to: 'provider',
        deadline: '2025-08-02',
        systemic_risk_only: true,
    },
    {
        article: 'Article 55(1)(b)',
        title: 'Systemic Risk Assessment & Mitigation',
        description: 'Assess and mitigate possible systemic risks at Union level, including their sources, that may stem from the development, the placing on the market, or the use of general-purpose AI models with systemic risk.',
        applies_to: 'provider',
        deadline: '2025-08-02',
        systemic_risk_only: true,
    },
    {
        article: 'Article 55(1)(c)',
        title: 'Incident Reporting',
        description: 'Keep track of, document, and report, without undue delay, to the AI Office and, as appropriate, to national competent authorities, relevant information about serious incidents and possible corrective measures to address them.',
        applies_to: 'provider',
        deadline: '2025-08-02',
        systemic_risk_only: true,
    },
    {
        article: 'Article 55(1)(d)',
        title: 'Cybersecurity Protection',
        description: 'Ensure an adequate level of cybersecurity protection for the general-purpose AI model with systemic risk and the physical infrastructure of the model.',
        applies_to: 'provider',
        deadline: '2025-08-02',
        systemic_risk_only: true,
    },
];

const GPAI_DEPLOYER_TRANSPARENCY_OBLIGATIONS: string[] = [
    'Article 50(1): Inform users they are interacting with an AI system (unless obvious from context)',
    'Article 50(2): Ensure AI-generated outputs are marked in machine-readable format as artificially generated or manipulated',
    'Article 50(4): Disclose that content constituting a deep fake has been artificially generated or manipulated',
];

// =============================================================================
// CLASSIFICATION ENGINE
// =============================================================================

/**
 * Classify whether an AI system uses GPAI models.
 * 
 * This function analyzes LLM capability analysis data to determine:
 * 1. Whether the system deploys GPAI models (most common case)
 * 2. Which providers/models are detected
 * 3. Whether systemic risk models are involved
 * 4. Which obligations apply
 * 
 * @param analysis - LLM capability analysis from Prisma
 * @returns GPAIClassification with full obligation mapping
 */
export function classifyGPAI(analysis: LlmCapabilityAnalysis): GPAIClassification {
    const libraries = (analysis.libraries as string[]) || [];
    const frameworks = (analysis.ai_frameworks as string[]) || [];
    const capabilities = (analysis.capabilities as string[]) || [];
    const modelTypes = (analysis.detected_model_types as string[]) || [];

    // Normalize all inputs to lowercase for matching
    const normalizedLibraries = libraries.map(l => l.toLowerCase().trim());
    const normalizedFrameworks = frameworks.map(f => f.toLowerCase().trim());
    const normalizedCapabilities = capabilities.map(c => c.toLowerCase().trim());
    const normalizedModelTypes = modelTypes.map(m => m.toLowerCase().trim());

    // Step 1: Match against known GPAI providers
    const providerMatches = detectGPAIProviders(
        normalizedLibraries,
        normalizedFrameworks,
        normalizedCapabilities,
        normalizedModelTypes
    );

    // Step 2: Check for orchestration framework usage
    const usesOrchestration = detectOrchestrationFrameworks(
        normalizedLibraries,
        normalizedFrameworks
    );

    // Step 3: Check for GPAI capability keywords
    const hasGPAICapabilities = detectGPAICapabilities(normalizedCapabilities);

    // Step 4: Determine GPAI status
    const isGPAIDeployer = providerMatches.length > 0 || (usesOrchestration && hasGPAICapabilities);
    const isGPAIProvider = false; // Our users are deployers, not providers. Provider detection would require training code analysis.
    const hasSystemicRisk = providerMatches.some(m => m.systemic_risk);

    // Step 5: Check open-source exception (Article 53(2))
    const allOpenSource = providerMatches.length > 0 &&
        providerMatches.every(m => m.open_source) &&
        !hasSystemicRisk;

    // Step 6: Map obligations
    const obligations = mapObligations(isGPAIDeployer, isGPAIProvider, hasSystemicRisk);

    // Step 7: Map transparency requirements
    const transparencyRequirements = isGPAIDeployer
        ? GPAI_DEPLOYER_TRANSPARENCY_OBLIGATIONS
        : [];

    // Step 8: Collect article references
    const articleReferences = collectArticleReferences(isGPAIDeployer, isGPAIProvider, hasSystemicRisk);

    // Step 9: Collect detected model names
    const detectedModels = collectDetectedModels(providerMatches, normalizedCapabilities, normalizedModelTypes);

    // Step 10: Generate summary
    const summary = generateGPAISummary(
        isGPAIDeployer,
        isGPAIProvider,
        hasSystemicRisk,
        allOpenSource,
        providerMatches,
        detectedModels
    );

    return {
        is_gpai_deployer: isGPAIDeployer,
        is_gpai_provider: isGPAIProvider,
        is_systemic_risk: hasSystemicRisk,
        detected_providers: providerMatches,
        detected_models: detectedModels,
        open_source_exception: allOpenSource,
        obligations,
        transparency_requirements: transparencyRequirements,
        article_references: articleReferences,
        summary,
    };
}

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

function detectGPAIProviders(
    libraries: string[],
    frameworks: string[],
    capabilities: string[],
    modelTypes: string[]
): GPAIProviderMatch[] {
    const matches: GPAIProviderMatch[] = [];
    const allInputs = [...libraries, ...frameworks];

    for (const [providerKey, provider] of Object.entries(GPAI_PROVIDERS)) {
        let matched = false;
        let matchedBy: GPAIProviderMatch['matched_by'] = 'library';
        let confidence = 0;

        // Check library indicators
        for (const indicator of provider.library_indicators) {
            if (allInputs.some(lib => lib.includes(indicator) || indicator.includes(lib))) {
                matched = true;
                matchedBy = 'library';
                confidence = 0.95;
                break;
            }
        }

        // Check model names in capabilities/model types
        if (!matched && provider.models.length > 0) {
            const allText = [...capabilities, ...modelTypes].join(' ');
            for (const model of provider.models) {
                if (allText.includes(model.toLowerCase())) {
                    matched = true;
                    matchedBy = 'model_type';
                    confidence = 0.85;
                    break;
                }
            }
        }

        // Check provider name in capabilities
        if (!matched) {
            const providerNameLower = provider.display_name.toLowerCase();
            if (capabilities.some(c => c.includes(providerNameLower) || c.includes(providerKey))) {
                matched = true;
                matchedBy = 'capability';
                confidence = 0.75;
            }
        }

        if (matched) {
            matches.push({
                provider_name: provider.display_name,
                matched_by: matchedBy,
                confidence,
                systemic_risk: provider.systemic_risk,
                open_source: provider.open_source,
            });
        }
    }

    return matches;
}

function detectOrchestrationFrameworks(libraries: string[], frameworks: string[]): boolean {
    const allInputs = [...libraries, ...frameworks];
    return GPAI_ORCHESTRATION_FRAMEWORKS.some(orch =>
        allInputs.some(lib => lib.includes(orch) || orch.includes(lib))
    );
}

function detectGPAICapabilities(capabilities: string[]): boolean {
    const allText = capabilities.join(' ');
    return GPAI_CAPABILITY_KEYWORDS.some(keyword => allText.includes(keyword));
}

function collectDetectedModels(
    providerMatches: GPAIProviderMatch[],
    capabilities: string[],
    modelTypes: string[]
): string[] {
    const models = new Set<string>();
    const allText = [...capabilities, ...modelTypes].join(' ');

    for (const [, provider] of Object.entries(GPAI_PROVIDERS)) {
        const isMatched = providerMatches.some(m => m.provider_name === provider.display_name);
        if (isMatched) {
            for (const model of provider.models) {
                if (allText.includes(model.toLowerCase())) {
                    models.add(model);
                }
            }
        }
    }

    return Array.from(models);
}

// =============================================================================
// OBLIGATION MAPPING
// =============================================================================

function mapObligations(
    isDeployer: boolean,
    isProvider: boolean,
    hasSystemicRisk: boolean
): GPAIObligation[] {
    const obligations: GPAIObligation[] = [];

    if (isProvider) {
        // All Article 53 obligations apply to providers
        obligations.push(...GPAI_PROVIDER_OBLIGATIONS);

        // Article 55 additional obligations for systemic risk
        if (hasSystemicRisk) {
            obligations.push(...GPAI_SYSTEMIC_RISK_OBLIGATIONS);
        }
    }

    if (isDeployer) {
        // Deployers have Article 50 transparency obligations
        // These are captured in transparency_requirements, not as GPAIObligation
        // But we add a deployer-facing summary obligation
        obligations.push({
            article: 'Article 50',
            title: 'Transparency to End Users',
            description: 'Ensure users are informed they are interacting with an AI system. AI-generated outputs must be marked as artificially generated in a machine-readable format.',
            applies_to: 'deployer',
            deadline: '2026-08-02', // Article 50 enters force later
            systemic_risk_only: false,
        });
    }

    return obligations;
}

function collectArticleReferences(
    isDeployer: boolean,
    isProvider: boolean,
    hasSystemicRisk: boolean
): string[] {
    const refs: string[] = [];

    if (isDeployer || isProvider) {
        refs.push('Chapter V: General-Purpose AI Models');
    }

    if (isProvider) {
        refs.push('Article 53: Obligations for Providers of GPAI Models');
        refs.push('Annex XI: Technical Documentation for GPAI');
        refs.push('Annex XII: Information for Downstream Providers');
    }

    if (isProvider && hasSystemicRisk) {
        refs.push('Article 51: Systemic Risk Classification (≥10^25 FLOPs)');
        refs.push('Article 55: Additional Obligations for Systemic Risk GPAI');
        refs.push('Annex XIII: Systemic Risk Criteria');
    }

    if (isDeployer) {
        refs.push('Article 50: Transparency Obligations for Deployers');
    }

    return refs;
}

// =============================================================================
// SUMMARY GENERATION
// =============================================================================

function generateGPAISummary(
    isDeployer: boolean,
    isProvider: boolean,
    hasSystemicRisk: boolean,
    openSourceException: boolean,
    providers: GPAIProviderMatch[],
    models: string[]
): string {
    if (!isDeployer && !isProvider) {
        return 'No GPAI model usage detected. System does not appear to use general-purpose AI models.';
    }

    const parts: string[] = [];

    if (isDeployer) {
        const providerNames = providers.map(p => p.provider_name).join(', ');
        parts.push(`GPAI Deployer detected: integrates models from ${providerNames || 'unknown provider'}.`);
    }

    if (isProvider) {
        parts.push('GPAI Provider detected: trains or hosts general-purpose AI models.');
    }

    if (hasSystemicRisk) {
        parts.push('[WARNING] Systemic risk GPAI models detected (≥10^25 FLOPs). Additional Article 55 obligations apply.');
    }

    if (openSourceException) {
        parts.push('Open-source exception may apply (Article 53(2)): all detected models are released under free/open-source licenses with public parameters.');
    }

    if (models.length > 0) {
        parts.push(`Detected models: ${models.join(', ')}.`);
    }

    if (isDeployer) {
        parts.push('Article 50 transparency obligations apply from 2 August 2026.');
    }

    return parts.join(' ');
}
