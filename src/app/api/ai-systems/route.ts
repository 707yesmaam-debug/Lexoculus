'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

/**
 * GET /api/ai-systems
 * List all AI systems for the authenticated user
 */
export async function GET() {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const aiSystems = await prisma.aiSystem.findMany({
            where: {
                user_id: user.id,
                status: 'active'
            },
            include: {
                latest_scan: {
                    select: {
                        id: true,
                        repo_name: true,
                        repo_owner: true,
                        github_repo_url: true,
                        scanned_at: true,
                    }
                }
            },
            orderBy: { updated_at: 'desc' }
        });

        // Calculate summary stats
        const stats = {
            total: aiSystems.length,
            high_risk: aiSystems.filter(s => s.risk_classification === 'HIGH_RISK').length,
            limited_risk: aiSystems.filter(s => s.risk_classification === 'LIMITED_RISK').length,
            minimal_risk: aiSystems.filter(s => s.risk_classification === 'MINIMAL_RISK').length,
            unacceptable_risk: aiSystems.filter(s => s.risk_classification === 'UNACCEPTABLE').length,
            unclassified: aiSystems.filter(s => !s.risk_classification).length,
        };

        return NextResponse.json({
            ai_systems: aiSystems,
            stats
        });

    } catch (error) {
        console.error('AI Systems list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch AI systems' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/ai-systems
 * Create a new AI system (manual or from scan)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, source_repo_url, repo_scan_id } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        // Check for duplicate name
        const existing = await prisma.aiSystem.findUnique({
            where: {
                user_id_name: {
                    user_id: user.id,
                    name: name.trim()
                }
            }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'An AI system with this name already exists' },
                { status: 409 }
            );
        }

        // If linking to a scan, fetch the scan data
        let scanData = null;
        if (repo_scan_id) {
            scanData = await prisma.repoScan.findUnique({
                where: { id: repo_scan_id },
                include: {
                    llm_analysis: true,
                    risk_assessment: true,
                    final_risk_assessment: true,
                }
            });

            if (!scanData || scanData.user_id !== user.id) {
                return NextResponse.json(
                    { error: 'Scan not found or unauthorized' },
                    { status: 404 }
                );
            }
        }

        // Create the AI system
        const aiSystem = await prisma.aiSystem.create({
            data: {
                user_id: user.id,
                name: name.trim(),
                description: description || null,
                source_repo_url: source_repo_url || scanData?.github_repo_url || null,
                latest_scan_id: repo_scan_id || null,
                risk_classification: scanData?.final_risk_assessment?.final_risk_classification
                    || scanData?.risk_assessment?.risk_classification
                    || null,
                risk_score: scanData?.final_risk_assessment?.final_risk_score
                    || scanData?.risk_assessment?.risk_score
                    || null,
                last_scanned_at: scanData?.scanned_at || null,
                capabilities: scanData?.llm_analysis?.capabilities || undefined,
                matched_articles: scanData?.risk_assessment?.matched_annex_iii_articles || undefined,
            }
        });

        console.log(`✅ [AI_SYSTEM] Created: ${aiSystem.name} (${aiSystem.id})`);

        return NextResponse.json({
            ai_system: aiSystem,
            message: 'AI system created successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('AI System create error:', error);
        return NextResponse.json(
            { error: 'Failed to create AI system' },
            { status: 500 }
        );
    }
}
