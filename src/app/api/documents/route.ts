'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import {
    generateDocument,
    DOCUMENT_TYPES,
    DocumentType
} from '@/lib/document-generator';

/**
 * GET /api/documents
 * List all documents for user's AI Systems
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const aiSystemId = searchParams.get('ai_system_id');

        const where = aiSystemId
            ? { ai_system_id: aiSystemId, ai_system: { user_id: user.id } }
            : { ai_system: { user_id: user.id } };

        const documents = await prisma.complianceDocument.findMany({
            where,
            include: {
                ai_system: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { updated_at: 'desc' }
        });

        return NextResponse.json({
            documents,
            document_types: DOCUMENT_TYPES
        });

    } catch (error) {
        console.error('Documents list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/documents
 * Generate a new document for an AI System
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ai_system_id, document_type } = await request.json();

        if (!ai_system_id || !document_type) {
            return NextResponse.json(
                { error: 'ai_system_id and document_type required' },
                { status: 400 }
            );
        }

        if (!DOCUMENT_TYPES[document_type as DocumentType]) {
            return NextResponse.json(
                { error: 'Invalid document_type' },
                { status: 400 }
            );
        }

        // Verify ownership and get AI System with related data
        const aiSystem = await prisma.aiSystem.findUnique({
            where: { id: ai_system_id },
            include: {
                user: true,
                latest_scan: {
                    include: {
                        llm_analysis: true,
                        risk_assessment: true,
                    }
                }
            }
        });

        if (!aiSystem) {
            return NextResponse.json({ error: 'AI System not found' }, { status: 404 });
        }

        if (aiSystem.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if document already exists
        const existing = await prisma.complianceDocument.findUnique({
            where: {
                ai_system_id_document_type: {
                    ai_system_id,
                    document_type
                }
            }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Document already exists. Use PUT to update.', document_id: existing.id },
                { status: 409 }
            );
        }

        // Prepare data for generator
        const scanData = {
            aiSystem: {
                id: aiSystem.id,
                name: aiSystem.name,
                description: aiSystem.description,
                risk_classification: aiSystem.risk_classification,
                risk_score: aiSystem.risk_score,
                last_scanned_at: aiSystem.last_scanned_at,
                capabilities: aiSystem.capabilities as Record<string, unknown> | null,
                matched_articles: aiSystem.matched_articles as Record<string, unknown>[] | null,
            },
            llmAnalysis: aiSystem.latest_scan?.llm_analysis ? {
                capabilities: (aiSystem.latest_scan.llm_analysis.capabilities as string[]) || [],
                libraries: (aiSystem.latest_scan.llm_analysis.libraries as string[]) || [],
                intended_purpose: (aiSystem.latest_scan.llm_analysis as Record<string, unknown>).primary_purpose as string || '',
            } : null,
            riskAssessment: aiSystem.latest_scan?.risk_assessment ? {
                risk_narrative: aiSystem.latest_scan.risk_assessment.risk_narrative || '',
                matched_annex_iii_articles: (aiSystem.latest_scan.risk_assessment.matched_annex_iii_articles as Record<string, unknown>[]) || [],
            } : null,
            user: {
                email: aiSystem.user.email,
                full_name: aiSystem.user.full_name || undefined,
            }
        };

        // Generate document
        const generated = generateDocument(document_type as DocumentType, scanData);

        // Save to database
        const document = await prisma.complianceDocument.create({
            data: {
                ai_system_id,
                document_type,
                title: generated.title,
                content: { markdown: generated.content },
                completion_percent: generated.completionPercent,
                missing_fields: generated.missingFields,
                status: generated.completionPercent === 100 ? 'complete' : 'draft',
            }
        });

        console.log(`📄 [DOCUMENT] Generated ${document_type} for ${aiSystem.name} (${generated.completionPercent}% complete)`);

        return NextResponse.json({
            document_id: document.id,
            document_type,
            title: generated.title,
            completion_percent: generated.completionPercent,
            missing_fields: generated.missingFields,
            status: document.status,
        });

    } catch (error) {
        console.error('Document generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate document' },
            { status: 500 }
        );
    }
}
