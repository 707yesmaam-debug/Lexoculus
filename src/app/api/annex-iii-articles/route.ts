import { NextResponse } from 'next/server';
import { getAllArticles, UNACCEPTABLE_RISKS } from '@/lib/annex-iii-articles';

/**
 * GET /api/annex-iii-articles
 * 
 * Public endpoint to get all Annex III articles reference
 */
export async function GET() {
    const articles = getAllArticles();

    return NextResponse.json({
        articles: articles.map(a => ({
            article: a.article,
            category: a.category,
            description: a.description,
            riskTier: a.riskTier,
            requirements: a.requirements,
            examples: a.examples,
        })),
        unacceptable_risks: UNACCEPTABLE_RISKS,
        total_articles: articles.length,
    });
}
