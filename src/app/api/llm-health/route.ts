import { NextResponse } from 'next/server';
import { checkGroqHealth } from '@/lib/analysis/groq';

/**
 * GET /api/llm-health
 * 
 * Public endpoint to check LLM service health
 */
export async function GET() {
    const health = await checkGroqHealth();

    return NextResponse.json(health, {
        status: health.status === 'healthy' ? 200 : 503,
    });
}
