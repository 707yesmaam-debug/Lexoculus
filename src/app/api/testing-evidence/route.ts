import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import prisma from '@/lib/infra/prisma';
import crypto from 'crypto';
import { uploadEvidenceToSupabase } from '@/lib/infra/storage';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const aiSystemId = searchParams.get('ai_system_id');

        if (!aiSystemId) {
            return NextResponse.json({ error: 'ai_system_id is required' }, { status: 400 });
        }

        const evidence = await prisma.testingEvidence.findMany({
            where: {
                ai_system_id: aiSystemId,
                user_id: user.id
            },
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json({ evidence });
    } catch (error) {
        console.error('Testing evidence GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch testing evidence' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Check Subscription Tier
        const { getOrCreateSubscription } = await import('@/lib/platform/subscription');
        const subscription = await getOrCreateSubscription(user.id);
        const isPro = subscription && (subscription.tier === 'pro' || subscription.tier === 'enterprise');

        if (!isPro) {
            return NextResponse.json(
                { error: 'Content upload is restricted to Pro users' },
                { status: 403 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const aiSystemId = formData.get('ai_system_id') as string;
        const requirementId = formData.get('requirement_id') as string;
        const category = formData.get('category') as string;
        const description = formData.get('description') as string | null;

        if (!file || !aiSystemId || !requirementId || !category) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify ownership
        const aiSystem = await prisma.aiSystem.findUnique({
            where: { id: aiSystemId },
            select: { user_id: true }
        });

        if (!aiSystem || aiSystem.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Upload File
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

        const result = await uploadEvidenceToSupabase(
            buffer,
            user.id,
            aiSystemId,
            file.name,
            file.type
        );

        const evidence = await prisma.testingEvidence.create({
            data: {
                ai_system_id: aiSystemId,
                user_id: user.id,
                requirement_id: requirementId,
                category,
                title: file.name,
                description,
                file_url: result.url,
                file_name: file.name,
                file_size: file.size,
                hash: fileHash,
                test_date: new Date(),
                tested_by: user.id,
                status: 'uploaded'
            }
        });

        return NextResponse.json(evidence);
    } catch (error) {
        console.error('Testing evidence POST error:', error);
        return NextResponse.json({ error: 'Failed to upload testing evidence' }, { status: 500 });
    }
}
