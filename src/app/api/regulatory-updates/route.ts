'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';

/**
 * GET /api/regulatory-updates
 * List regulatory updates with optional filtering by relevance to user's systems
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const updateType = searchParams.get('type');
        const severity = searchParams.get('severity');
        const forMySystemsOnly = searchParams.get('my_systems') === 'true';
        const limit = parseInt(searchParams.get('limit') || '20');

        // Build query
        const where: Record<string, unknown> = {};
        if (updateType) where.update_type = updateType;
        if (severity) where.severity = severity;

        let updates = await prisma.regulatoryUpdate.findMany({
            where,
            orderBy: { published_at: 'desc' },
            take: limit,
        });

        // If filtering for user's systems, get their matched articles and filter
        let matchedUpdates: typeof updates = [];
        if (forMySystemsOnly) {
            const userSystems = await prisma.aiSystem.findMany({
                where: { user_id: user.id },
                select: {
                    id: true,
                    name: true,
                    risk_classification: true,
                    matched_articles: true,
                }
            });

            // Extract all articles affecting user's systems
            const userArticles = new Set<string>();
            const userRisks = new Set<string>();

            userSystems.forEach(system => {
                if (system.risk_classification) {
                    userRisks.add(system.risk_classification);
                }
                if (system.matched_articles) {
                    const articles = system.matched_articles as Array<{ clause_id?: string }>;
                    articles.forEach(a => {
                        if (a.clause_id) {
                            // Extract article number (e.g., "Article 6" from "Article 6.1")
                            const match = a.clause_id.match(/Article\s+\d+/i);
                            if (match) userArticles.add(match[0]);
                        }
                    });
                }
            });

            // Filter updates that affect user's articles or risk classifications
            matchedUpdates = updates.filter(update => {
                const affectsArticle = update.affected_articles.some(a =>
                    userArticles.has(a) ||
                    Array.from(userArticles).some(ua => a.includes(ua))
                );
                const affectsRisk = update.affected_risks.some(r => userRisks.has(r));
                return affectsArticle || affectsRisk;
            });
        }

        return NextResponse.json({
            updates: forMySystemsOnly ? matchedUpdates : updates,
            total: forMySystemsOnly ? matchedUpdates.length : updates.length,
            filtered_for_user: forMySystemsOnly,
        });

    } catch (error) {
        console.error('Regulatory updates list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch regulatory updates' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/regulatory-updates
 * Create a new regulatory update (admin only in production)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            source,
            source_url,
            reference_id,
            title,
            summary,
            content,
            update_type,
            severity,
            affected_articles,
            affected_risks,
            published_at,
            effective_date,
        } = body;

        if (!source || !title || !summary || !update_type || !published_at) {
            return NextResponse.json(
                { error: 'source, title, summary, update_type, and published_at required' },
                { status: 400 }
            );
        }

        // Check for duplicate by reference_id
        if (reference_id) {
            const existing = await prisma.regulatoryUpdate.findUnique({
                where: { reference_id }
            });
            if (existing) {
                return NextResponse.json(
                    { error: 'Update already exists', id: existing.id },
                    { status: 409 }
                );
            }
        }

        const update = await prisma.regulatoryUpdate.create({
            data: {
                source,
                source_url,
                reference_id,
                title,
                summary,
                content,
                update_type,
                severity: severity || 'info',
                affected_articles: affected_articles || [],
                affected_risks: affected_risks || [],
                published_at: new Date(published_at),
                effective_date: effective_date ? new Date(effective_date) : null,
            }
        });

        console.log(`📰 [REGULATORY] New ${update_type}: ${title}`);

        // Create alerts for users with affected systems
        // cast Update to Expected Type (Prisma returns nullable fields based on schema, but we ensured defaults)
        await createAlertsForAffectedUsers({
            ...update,
            severity: update.severity || 'info',
        });

        return NextResponse.json(update, { status: 201 });

    } catch (error) {
        console.error('Regulatory update creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create regulatory update' },
            { status: 500 }
        );
    }
}

/**
 * Create monitoring alerts for users whose AI systems are affected by this update
 */
async function createAlertsForAffectedUsers(update: {
    id: string;
    title: string;
    summary: string;
    severity: string | null;
    affected_articles: string[];
    affected_risks: string[];
}) {
    try {
        // Find all AI systems that might be affected
        const affectedSystems = await prisma.aiSystem.findMany({
            where: {
                OR: [
                    // Match by risk classification
                    { risk_classification: { in: update.affected_risks } },
                ]
            },
            select: {
                id: true,
                user_id: true,
                name: true,
            }
        });

        // Create alerts for each affected user (deduplicated)
        const alertedUsers = new Set<string>();

        for (const system of affectedSystems) {
            if (alertedUsers.has(system.user_id)) continue;
            alertedUsers.add(system.user_id);

            await prisma.monitoringAlert.create({
                data: {
                    user_id: system.user_id,
                    ai_system_id: system.id,
                    category: 'regulatory_update',
                    severity: update.severity,
                    title: `Regulatory Update: ${update.title}`,
                    message: `This update may affect your AI system "${system.name}". ${update.summary}`,
                    metadata: JSON.parse(JSON.stringify({
                        regulatory_update_id: update.id,
                        affected_articles: update.affected_articles,
                    })),
                }
            });
        }

        console.log(`🔔 [REGULATORY] Created alerts for ${alertedUsers.size} affected users`);

    } catch (error) {
        console.error('Failed to create regulatory alerts:', error);
    }
}
