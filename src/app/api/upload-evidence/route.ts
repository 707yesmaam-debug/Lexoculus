import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infra/supabase-server';
import { uploadEvidenceToSupabase } from '@/lib/infra/storage';
import prisma from '@/lib/infra/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const riskAssessmentId = formData.get('riskAssessmentId') as string;
        const aiSystemId = formData.get('ai_system_id') as string | null;
        const conformityStepId = formData.get('conformity_step_id') as string | null;
        const conformityAssessmentId = formData.get('conformity_assessment_id') as string | null;
        const evidenceType = formData.get('evidence_type') as string | null;

        if (!file || (!riskAssessmentId && !aiSystemId)) {
            return NextResponse.json(
                { error: 'Missing file or required ID (riskAssessmentId or ai_system_id)' },
                { status: 400 }
            );
        }

        // Security: Validate File Size (Max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: 'File size exceeds 5MB limit' },
                { status: 413 }
            );
        }

        // Security: Validate File Type
        const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'text/csv'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PDF, PNG, JPEG, and CSV are allowed.' },
                { status: 415 }
            );
        }

        // 1. Authenticate
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

        // 3. Convert to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 4. Compute Hash for Integrity
        const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

        // 5. Upload File
        const result = await uploadEvidenceToSupabase(
            buffer,
            user.id,
            aiSystemId || riskAssessmentId,
            file.name,
            file.type
        );

        // 6. Create ComplianceEvidence record if AI System ID is provided
        let evidenceRecord = null;
        if (aiSystemId) {
            evidenceRecord = await prisma.complianceEvidence.create({
                data: {
                    user_id: user.id,
                    ai_system_id: aiSystemId,
                    evidence_type: evidenceType || 'conformity_evidence',
                    title: file.name,
                    file_url: result.url,
                    file_name: file.name,
                    file_size: file.size,
                    mime_type: file.type,
                    hash: fileHash,
                    collected_by: user.id,
                    conformity_step_id: conformityStepId,
                    conformity_assessment_id: conformityAssessmentId,
                }
            });
        }

        return NextResponse.json({ url: result.url, evidence: evidenceRecord });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Internal upload failure' },
            { status: 500 }
        );
    }
}
