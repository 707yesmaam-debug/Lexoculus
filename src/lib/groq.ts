/**
 * Groq API Client for LLM Capability Analysis
 * 
 * Uses Groq's fast inference API with Llama-3 or Mixtral models
 * Free tier: https://console.groq.com/
 * 
 * HYBRID APPROACH:
 * 1. Deterministic scanner runs FIRST to detect verified libraries
 * 2. LLM focuses on PURPOSE/CONTEXT only (not library guessing)
 */

import { RepoScan } from '@prisma/client';
import { scanDependencies, DependencyScanResult, getScanSummary } from './dependency-scanner';

// Types for analysis results
export interface AnalysisResult {
    is_ai_system: boolean;
    capabilities: string[];
    libraries: string[];
    ai_frameworks: string[];
    programming_languages: string[];
    detected_model_types: string[];
    has_ml_pipeline: boolean;
    has_training_code: boolean;
    has_inference_code: boolean;
    has_data_processing: boolean;
    has_model_serialization: boolean;
    estimated_risk_indicators: {
        uses_computer_vision: boolean;
        uses_biometric_processing: boolean;
        uses_emotion_recognition: boolean;
        uses_critical_infrastructure: boolean;
        uses_generative_ai: boolean;
        uses_nlp: boolean;
        uses_nlp_decision_making: boolean;
        targets_vulnerable_persons: boolean;
        high_impact_decision_making: boolean;
    };
    reasoning: string;
}

export interface GroqResponse {
    analysis: AnalysisResult;
    model: string;
    duration_ms: number;
    confidence_score: number;
}

// Default risk indicators (all false)
const DEFAULT_RISK_INDICATORS = {
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

/**
 * Build the analysis prompt from repository scan data
 * @deprecated Use buildEnhancedPrompt with scanner results instead
 */
function buildPrompt(repoScan: RepoScan): string {
    const fileTreeStr = repoScan.file_tree
        ? JSON.stringify(repoScan.file_tree, null, 2).slice(0, 3000)
        : 'N/A';

    const packageJson = repoScan.package_json_content as Record<string, unknown> | null;
    const depsStr = packageJson?.dependencies
        ? JSON.stringify(packageJson.dependencies, null, 2)
        : 'N/A';

    return `You are an expert AI system analyst. Analyze the following repository and extract AI capabilities.

REPOSITORY: ${repoScan.repo_name}
OWNER: ${repoScan.repo_owner}
PRIMARY LANGUAGE: ${repoScan.primary_language || 'Unknown'}

README (first 2000 chars):
${(repoScan.readme_content || 'N/A').slice(0, 2000)}

PYTHON DEPENDENCIES (requirements.txt):
${repoScan.requirements_txt_content || 'N/A'}

NODE.JS DEPENDENCIES (package.json):
${depsStr}

FILE STRUCTURE (truncated):
${fileTreeStr}

Based on this information, analyze and respond with ONLY valid JSON (no markdown, no backticks, no explanation):

{
  "is_ai_system": boolean,
  "capabilities": ["list of AI capabilities like 'Computer Vision', 'NLP', 'Recommender System'"],
  "libraries": ["list of AI/ML libraries detected like 'torch', 'tensorflow', 'sklearn'"],
  "ai_frameworks": ["list of frameworks like 'PyTorch', 'TensorFlow', 'Hugging Face'"],
  "programming_languages": ["list of primary languages"],
  "detected_model_types": ["list like 'Neural Network', 'Transformer', 'Decision Tree'"],
  "has_ml_pipeline": boolean,
  "has_training_code": boolean,
  "has_inference_code": boolean,
  "has_data_processing": boolean,
  "has_model_serialization": boolean,
  "estimated_risk_indicators": {
    "uses_computer_vision": boolean,
    "uses_biometric_processing": boolean,
    "uses_emotion_recognition": boolean,
    "uses_critical_infrastructure": boolean,
    "uses_generative_ai": boolean,
    "uses_nlp": boolean,
    "uses_nlp_decision_making": boolean,
    "targets_vulnerable_persons": boolean,
    "high_impact_decision_making": boolean
  },
  "reasoning": "Brief explanation of your analysis"
}`;
}

/**
 * Build enhanced prompt with VERIFIED scanner data + CANDIDATE libraries
 * 3-Layer approach:
 *   Layer 1: Known database matches (highest confidence)
 *   Layer 2: Pattern-matched candidates (medium confidence)
 *   Layer 3: LLM can supplement/validate (lower confidence)
 */
function buildEnhancedPrompt(repoScan: RepoScan, scanResult: DependencyScanResult): string {
    // Layer 1: Verified libraries from known database
    const verifiedLibraries = scanResult.detected_libraries.map(l => l.library.name);
    const verifiedCategories = scanResult.detected_categories;
    const verifiedFrameworks = scanResult.frameworks;
    const highRiskLibs = scanResult.high_risk_libraries;
    const modelFiles = scanResult.detected_model_files.slice(0, 10); // Limit

    // Layer 2: Pattern-matched candidates
    const candidateLibraries = scanResult.candidate_libraries.map(c => ({
        name: c.name,
        pattern: c.matched_pattern,
        confidence: c.pattern_confidence,
        category: c.inferred_category || 'unknown',
    }));

    // All packages (for Layer 3 LLM review)
    const allPackages = scanResult.all_packages.slice(0, 100); // Limit for prompt size

    // Risk indicators already computed by scanner
    const riskFlags = Object.entries(scanResult.risk_indicators)
        .filter(([, v]) => v)
        .map(([k]) => k);

    // Combine verified + high-confidence candidates for the library list
    const allConfirmedLibs = [
        ...verifiedLibraries,
        ...candidateLibraries.filter(c => c.confidence >= 0.8).map(c => c.name),
    ];

    return `You are an expert EU AI Act compliance analyst. Analyze the PURPOSE and CONTEXT of this repository.

=== 3-LAYER LIBRARY DETECTION SYSTEM ===
Layer 1 (VERIFIED - from known database): ${verifiedLibraries.length > 0 ? verifiedLibraries.join(', ') : 'None'}
Layer 2 (CANDIDATES - pattern-matched): ${candidateLibraries.length > 0 ? candidateLibraries.map(c => `${c.name} (${c.pattern})`).join(', ') : 'None'}
Layer 3 (YOUR TASK): Review ALL packages and ADD any AI/ML libraries not detected above.

=== REPOSITORY INFO ===
Name: ${repoScan.repo_name}
Owner: ${repoScan.repo_owner}
Language: ${repoScan.primary_language || 'Unknown'}

=== DETECTED FRAMEWORKS ===
${verifiedFrameworks.length > 0 ? verifiedFrameworks.join(', ') : 'None'}

=== DETECTED CATEGORIES ===
${verifiedCategories.length > 0 ? verifiedCategories.join(', ') : 'None'}

=== HIGH-RISK LIBRARIES ⚠️ ===
${highRiskLibs.length > 0 ? highRiskLibs.join(', ') : 'None'}

=== MODEL FILES FOUND ===
${modelFiles.length > 0 ? modelFiles.join(', ') : 'None'}

=== SCANNER RISK FLAGS ===
${riskFlags.length > 0 ? riskFlags.join(', ') : 'None'}

=== ALL PACKAGES (for Layer 3 review) ===
${allPackages.join(', ')}

=== README (for context) ===
${(repoScan.readme_content || 'N/A').slice(0, 2500)}

=== YOUR TASK ===
1. REVIEW Layer 2 candidates - are they truly AI/ML related?
2. ADD any AI/ML libraries from the package list that we missed (Layer 3)
3. Determine the PURPOSE and USE CASE of this AI system
4. Identify risk indicators based on README context

Respond with ONLY valid JSON:
{
  "is_ai_system": ${scanResult.is_ai_system || candidateLibraries.length > 0},
  "capabilities": ["list capabilities like 'Face Recognition', 'Text Generation', 'Object Detection'"],
  "libraries": ["COMBINE Layer 1 + validated Layer 2 + any Layer 3 additions"],
  "ai_frameworks": ${JSON.stringify(verifiedFrameworks.length > 0 ? verifiedFrameworks : ["infer from libraries"])},
  "programming_languages": ["${repoScan.primary_language || 'Unknown'}"],
  "detected_model_types": ["infer from libraries: 'Neural Network', 'Transformer', 'CNN', etc."],
  "has_ml_pipeline": boolean,
  "has_training_code": boolean,
  "has_inference_code": boolean,
  "has_data_processing": boolean,
  "has_model_serialization": ${modelFiles.length > 0},
  "estimated_risk_indicators": {
    "uses_computer_vision": ${scanResult.risk_indicators.uses_computer_vision},
    "uses_biometric_processing": ${scanResult.risk_indicators.uses_biometric_processing},
    "uses_emotion_recognition": ${scanResult.risk_indicators.uses_emotion_recognition},
    "uses_critical_infrastructure": boolean (infer from README context),
    "uses_generative_ai": ${scanResult.risk_indicators.uses_generative_ai},
    "uses_nlp": ${scanResult.risk_indicators.uses_nlp},
    "uses_nlp_decision_making": boolean (infer from README context),
    "targets_vulnerable_persons": boolean (infer from README context),
    "high_impact_decision_making": boolean (infer from README context)
  },
  "reasoning": "Explain which libraries you validated from Layer 2 and any you added from Layer 3"
}`;
}

/**
 * Parse and validate LLM response
 */
function parseAndValidateResponse(responseText: string): AnalysisResult {
    // Try to extract JSON from response (handle markdown code blocks)
    let jsonStr = responseText.trim();

    // Extract JSON from code block if present
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
    } else {
        // Fallback: cleanup potential markdown without code blocks
        jsonStr = jsonStr.replace(/^```(?:json)?/, '').replace(/```$/, '');
    }

    // Parse JSON
    let parsed: AnalysisResult;
    try {
        parsed = JSON.parse(jsonStr);
    } catch (e) {
        console.error('❌ [GROQ] JSON Parse Error. Raw content:', jsonStr.slice(0, 500) + '...');
        // Attempt simple repair (remove newlines in strings? No, too risky)
        throw new Error(`Invalid JSON from LLM: ${jsonStr.slice(0, 50)}...`);
    }

    // Validate required fields
    const requiredFields = [
        'is_ai_system', 'capabilities', 'libraries', 'ai_frameworks',
        'programming_languages', 'detected_model_types', 'estimated_risk_indicators'
    ];

    for (const field of requiredFields) {
        if (!(field in parsed)) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    // Validate arrays aren't too long (likely hallucination)
    if (parsed.capabilities.length > 20) {
        throw new Error('Too many capabilities detected (likely hallucination)');
    }

    // Ensure estimated_risk_indicators has all fields
    parsed.estimated_risk_indicators = {
        ...DEFAULT_RISK_INDICATORS,
        ...parsed.estimated_risk_indicators,
    };

    return parsed;
}

/**
 * Calculate confidence score based on analysis quality
 */
function calculateConfidence(analysis: AnalysisResult, repoScan: RepoScan): number {
    let score = 0.5; // Base score

    // Has dependencies → more confident
    if (repoScan.requirements_txt_content || repoScan.package_json_content) {
        score += 0.15;
    }

    // Has README → more confident
    if (repoScan.readme_content && repoScan.readme_content.length > 100) {
        score += 0.1;
    }

    // Libraries detected match known AI libraries
    const knownAILibs = ['torch', 'tensorflow', 'sklearn', 'keras', 'transformers', 'numpy', 'pandas', 'opencv'];
    const matchedLibs = analysis.libraries.filter(lib =>
        knownAILibs.some(known => lib.toLowerCase().includes(known))
    );
    if (matchedLibs.length > 0) {
        score += 0.15;
    }

    // Reasoning provided
    if (analysis.reasoning && analysis.reasoning.length > 50) {
        score += 0.1;
    }

    return Math.min(score, 1.0);
}

/**
 * Enhanced confidence calculation using scanner data
 */
function calculateEnhancedConfidence(
    analysis: AnalysisResult,
    repoScan: RepoScan,
    scanResult: DependencyScanResult
): number {
    // Start with scanner confidence (already computed)
    let score = scanResult.confidence_score;

    // Has README → more context available
    if (repoScan.readme_content && repoScan.readme_content.length > 100) {
        score += 0.1;
    }

    // LLM reasoning quality
    if (analysis.reasoning && analysis.reasoning.length > 50) {
        score += 0.05;
    }

    // High-risk libraries = higher confidence in classification
    if (scanResult.high_risk_libraries.length > 0) {
        score += 0.1;
    }

    return Math.min(score, 1.0);
}

/**
 * Main analysis function - calls Groq API
 * 
 * HYBRID APPROACH:
 * 1. Runs deterministic scanner FIRST for verified library detection
 * 2. LLM focuses on PURPOSE/CONTEXT only (not library guessing)
 */
export async function analyzeRepository(repoScan: RepoScan): Promise<GroqResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY environment variable is not set');
    }

    // STEP 1: Run deterministic scanner FIRST (mandatory, ~10ms)
    console.log(`🔍 [SCANNER] Running deterministic dependency scan...`);
    const scanResult = scanDependencies(repoScan);
    console.log(`✅ [SCANNER] Completed in ${scanResult.scan_duration_ms}ms`);
    console.log(`   Detected ${scanResult.detected_libraries.length} AI libraries`);
    console.log(`   AI System: ${scanResult.is_ai_system}`);
    console.log(`   High-risk: ${scanResult.high_risk_libraries.length > 0 ? scanResult.high_risk_libraries.join(', ') : 'None'}`);

    // STEP 2: Build enhanced prompt with VERIFIED scanner data
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const prompt = buildEnhancedPrompt(repoScan, scanResult);

    const startTime = Date.now();

    console.log(`🤖 [GROQ] Calling Groq API for PURPOSE/CONTEXT analysis...`);
    console.log(`   Model: ${model}`);
    console.log(`   Repo: ${repoScan.repo_owner}/${repoScan.repo_name}`);

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert AI system analyst. Respond only with valid JSON, no markdown formatting.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3, // Low for consistent JSON
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const duration_ms = Date.now() - startTime;

        console.log(`✅ [GROQ] Response received in ${duration_ms}ms`);

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('Empty response from Groq API');
        }

        const analysis = parseAndValidateResponse(content);

        // Use enhanced confidence that incorporates scanner data
        const confidence_score = calculateEnhancedConfidence(analysis, repoScan, scanResult);

        console.log(`   AI System: ${analysis.is_ai_system}`);
        console.log(`   Capabilities: ${analysis.capabilities.length} found`);
        console.log(`   Confidence: ${(confidence_score * 100).toFixed(0)}%`);
        console.log(`   Scanner contribution: ${scanResult.detected_libraries.length} verified libraries`);

        return {
            analysis,
            model,
            duration_ms,
            confidence_score,
        };

    } catch (error) {
        const duration_ms = Date.now() - startTime;

        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                throw new Error('Groq rate limit exceeded. Please wait and try again.');
            }
            if (error.message.includes('timeout') || duration_ms > 60000) {
                throw new Error('Analysis timeout. Repository may be too large.');
            }
            throw error;
        }

        throw new Error('Unknown error during analysis');
    }
}

/**
 * Generate tailored compliance questions based on analysis
 */
export async function generateTailoredQuestions(
    analysis: AnalysisResult,
    repoName: string
): Promise<{ id: string; question: string; type: string }[]> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return [];

    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const prompt = `Based on the following AI system analysis, generate 3 specific "YES/NO" compliance verification questions.
The questions should specificially target the risks and capabilities identified.
Do not ask generic questions. Ask about the specific libraries, models, or data types detected.

ANALYSIS:
Repository: ${repoName}
Capabilities: ${analysis.capabilities.join(', ')}
Risks: ${JSON.stringify(analysis.estimated_risk_indicators)}
Libraries: ${analysis.libraries.join(', ')}

Respond ONLY with valid JSON in this format:
[
  { "id": "tailored_1", "question": "Question 1 text", "type": "boolean" },
  { "id": "tailored_2", "question": "Question 2 text", "type": "boolean" },
  { "id": "tailored_3", "question": "Question 3 text", "type": "boolean" }
]`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.4,
                max_tokens: 500,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) return [];

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';

        // Clean markdown
        const jsonStr = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        return JSON.parse(jsonStr);
    } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
            console.error('Tailored questions generation timed out (limit: 8s)');
        } else {
            console.error('Failed to generate tailored questions:', e);
        }
        return [];
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function checkGroqHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    model?: string;
    response_time_ms?: number;
    error?: string;
}> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return { status: 'unhealthy', error: 'GROQ_API_KEY not configured' };
    }

    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    const startTime = Date.now();

    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        const response_time_ms = Date.now() - startTime;

        if (!response.ok) {
            return { status: 'unhealthy', error: `API returned ${response.status}` };
        }

        return {
            status: 'healthy',
            model,
            response_time_ms,
        };

    } catch (error) {
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Connection failed',
        };
    }
}
