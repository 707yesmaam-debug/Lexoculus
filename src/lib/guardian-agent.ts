
import { RiskTier } from './annex-iii-articles';
import { TripwireResult } from './tripwire';

/**
 * Intelligent Guardian Agent
 * 
 * Uses Groq (Llama-3) to analyze code diffs for EU AI Act compliance risks.
 * This looks for LOGIC and FLAVOR that keyword matching misses.
 */

interface GuardianAnalysis {
    risk_found: boolean;
    risk_tier: RiskTier | 'NONE';
    confidence: number; // 0-1
    reasoning: string;
    flagged_snippets: string[];
}

/**
 * Analyze a PR diff using the LLM
 */
export async function analyzeDiffWithLLM(
    diff: string,
    filenames: string[]
): Promise<GuardianAnalysis> {
    const apiKey = process.env.GROQ_API_KEY;

    // Safety check: specific file types only to save tokens/time
    // We already filter in the webhook, but good to be safe.
    if (!apiKey) {
        console.warn('[WARN] [GUARDIAN] No GROQ_API_KEY found. Skipping Intelligent Analysis.');
        return {
            risk_found: false,
            risk_tier: 'NONE',
            confidence: 0,
            reasoning: 'LLM analysis skipped (no API key)',
            flagged_snippets: []
        };
    }

    // Truncate diff to avoid token limits (approx 12k chars is safe for fast monitoring)
    const truncatedDiff = diff.slice(0, 15000);
    const isTruncated = diff.length > 15000;

    const systemPrompt = `You are the EU AI Act Compliance Officer.
Your job is to review code changes (diffs) and detect PROHIBITED or HIGH-RISK AI practices.

RISK CRITERIA:
1. UNACCEPTABLE (Prohibited):
   - Subliminal manipulation / Dark patterns
   - Biometric categorization (Race, Politics, Religion)
   - Real-time remote biometric identification (Facial Rec in public)
   - Emotion recognition (Workplace/Education)
   - Social Scoring
   - Exploitation of vulnerabilities (Age, Disability)

2. HIGH_RISK (Regulated):
   - Biometric identification (Non-real-time)
   - Critical Infrastructure (Safety components)
   - Education/Vocational training (Access, Assessment)
   - Employment (Recruitment, Promotion, Termination)
   - Essential Services (Credit, Insurance, Benefits)
   - Law Enforcement (Risk assessment, Profiling)
   - Migration/Border Control (Polygraphs, Visa)
   - Administration of Justice

INSTRUCTIONS:
- Analyze the provided code diff.
- Look for LOGIC, VARIABLES, or COMMENTS that indicate these specific use cases.
- Ignore generic "AI" (like just importing torch). Look for intent (e.g. "calculate_social_score").
- If unsure, default to NONE. Only flag if you see evidence.

Respond ONLY with valid JSON:
{
  "risk_found": boolean,
  "risk_tier": "UNACCEPTABLE" | "HIGH_RISK" | "LIMITED_RISK" | "MINIMAL_RISK",
  "confidence": number (0.0 to 1.0),
  "reasoning": "Short explanation of why this code violates the act",
  "flagged_snippets": ["list of suspicious lines"]
}`;

    const userPrompt = `Files changed: ${filenames.join(', ')}
${isTruncated ? '(Diff truncated)' : ''}

DIFF:
${truncatedDiff}
`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.1, // Very explicit/deterministic
                response_format: { type: 'json_object' }
            }),
        });

        if (!response.ok) {
            throw new Error(`Groq API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        const result = JSON.parse(content);

        // Normalize result
        return {
            risk_found: result.risk_found || false,
            risk_tier: result.risk_tier || 'NONE',
            confidence: result.confidence || 0,
            reasoning: result.reasoning || 'No reasoning provided',
            flagged_snippets: result.flagged_snippets || []
        };

    } catch (error) {
        console.error('[ERROR] [GUARDIAN AGENT] Failed:', error);
        return {
            risk_found: false,
            risk_tier: 'NONE',
            confidence: 0,
            reasoning: 'LLM analysis failed',
            flagged_snippets: []
        };
    }
}
